'use strict'

const catchAlreadyExists = e => {
  if (e.code === 6); // A resource with that parent and ID already exists
  else throw e
}

const emptyBuffer = Buffer.from([])
const zeroBuffer = Buffer.from([0])

const ignoreErrors = error => { }

const ensureRegistry = async (
  iotClient, cloudRegion, projectId, registryId
) => await iotClient.createDeviceRegistry({
  parent: iotClient.locationPath(projectId, cloudRegion),
  deviceRegistry: { id: registryId },
}).catch(catchAlreadyExists)

const ensureDevice = async (
  iotClient, cloudRegion, projectId, registryId, publicKey, deviceId
) => await iotClient.createDevice({
  parent: iotClient.registryPath(projectId, cloudRegion, registryId),
  device: {
    id: deviceId,
    credentials: [{
      publicKey: {
        format: 'ES256_PEM',
        key: publicKey,
      },
    }],
  },
}).catch(catchAlreadyExists)

const ensurePair = async (
  iotClient, cloudRegion, projectId, registryId, publicKey, deviceId, proxyId
) => {
  await ensureRegistry(iotClient, cloudRegion, projectId, registryId)
  await Promise.all([
    ensureDevice(iotClient, cloudRegion, projectId, registryId, publicKey, deviceId),
    ensureDevice(iotClient, cloudRegion, projectId, registryId, publicKey, proxyId)
  ])
}

const createJwt = (projectId, privateKey, algorithm) => {
  const jwt = require('jsonwebtoken')
  // Create a JWT to authenticate this device. The device will be disconnected
  // after the token expires, and will have to reconnect with a new token. The
  // audience field should always be set to the GCP project id.
  const token = {
    iat: parseInt(Date.now() / 1000),
    exp: parseInt(Date.now() / 1000) + 60 * 60 * 24, // 1 day (max)
    aud: projectId,
  }
  return jwt.sign(token, privateKey, { algorithm })
}

const mqttConnect = async ({
  iotClient,
  projectId,
  cloudRegion,
  registryId,
  deviceId,
  algorithm,
  mqttBridgeHost,
  mqttBridgePort,
  privateKey,
}) => {
  const mqtt = require('mqtt')
  const mqttClientId = iotClient.devicePath(
    projectId, cloudRegion, registryId, deviceId)
  // With Google Cloud IoT Core, the username field is ignored, however it must
  // be non-empty. The password field is used to transmit a JWT to authorize the
  // device. The "mqtts" protocol causes the library to connect using SSL, which
  // is required for Cloud IoT Core.
  const connectionArgs = {
    host: mqttBridgeHost,
    port: mqttBridgePort,
    clientId: mqttClientId,
    username: 'unused',
    password: createJwt(projectId, privateKey, algorithm),
    protocol: 'mqtts',
    secureProtocol: 'TLSv1_2_method',
  }
  const client = mqtt.connect(connectionArgs)
  return await new Promise((resolve, reject) => {
    client.on('connect', () => resolve(client))
    client.on('close', () => reject(new Error('Connection closed')))
    client.on('error', reject)
    client.subscribe(`/devices/${deviceId}/commands/#`, { qos: 0 })
  })
}

const googleIoTControlled = ({
  mode,
  publicKey,
  privateKey,
  credentials,
  cloudRegion,
  frequency,
  keepalive,
  connected,
}) => async recv => {
  const iot = require('@google-cloud/iot')
  const uuid = require('uuid')
  const uuid_namespace = 'e72bc52c-7700-11eb-9439-0242ac130002'
  const iotClient = new iot.v1.DeviceManagerClient({ credentials })
  const projectId = credentials.project_id
  const registryId = 'pairs'
  const pairId = uuid.v5(publicKey, uuid_namespace)
  const deviceId = 'device-' + pairId
  const proxyId = 'proxy-' + pairId
  const localId = mode === 'device' ? deviceId : proxyId
  const remoteId = mode === 'device' ? proxyId : deviceId
  const localPath = iotClient.devicePath(
    projectId, cloudRegion, registryId, localId)
  const remotePath = iotClient.devicePath(
    projectId, cloudRegion, registryId, remoteId)

  const algorithm = 'ES256'
  const mqttBridgeHost = 'mqtt.googleapis.com'
  const mqttBridgePort = 8883

  const toRemote = (topic, buff = zeroBuffer) => {
    iotClient.sendCommandToDevice({
      name: remotePath,
      subfolder: topic,
      binaryData: buff,
    }).catch(ignoreErrors)
  }

  await ensurePair(
    iotClient,
    cloudRegion,
    projectId,
    registryId,
    publicKey,
    deviceId,
    proxyId
  )

  const client = await mqttConnect({
    iotClient,
    projectId,
    cloudRegion,
    registryId,
    deviceId: localId,
    algorithm,
    mqttBridgeHost,
    mqttBridgePort,
    privateKey,
  })

  connected('mqtt')

  const packetnoMax = 2 ** 16 - 1
  const nextPacketno = packetno => (packetno + 1) % packetnoMax
  const packetnoBuff = (packetno) => {
    const packetnoBuff = Buffer.alloc(2)
    packetnoBuff.writeUInt16BE(packetno)
    return packetnoBuff
  }
  let lastExchangeAt = 0
  let inPacketno = 1
  let outPacketno = 0
  let bufferCurr = emptyBuffer
  let bufferNext = emptyBuffer
  const currBuffer = () => bufferCurr
  const nextBuffer = () => {
    if (bufferNext.length) {
      outPacketno = nextPacketno(outPacketno)
      bufferCurr = Buffer.concat([packetnoBuff(outPacketno), bufferNext])
      bufferNext = emptyBuffer
      return bufferCurr
    } else {
      return emptyBuffer
    }
  }
  const send = buff => {
    if (Date.now() - lastExchangeAt > keepalive)
      bufferNext = emptyBuffer
    else
      bufferNext = Buffer.concat([bufferNext, buff])
  }

  client.on('message', (topic, message) => {
    lastExchangeAt = Date.now()
    if (topic.endsWith('command')) {
      if (!handshaked) return
      const packetno = message.readUInt16BE()
      console.log('from', mode === 'device'? 'gcs' : 'device', packetno, '/', inPacketno, message.length, packetno === inPacketno ? 'accept' : 'IGNORE')
      if (packetno === inPacketno) {
        inPacketno += 1
        recv(message.slice(2))
      }
    }
    else if (topic.endsWith('request')) {
      const packetno = message.readUInt16BE()
      if (packetno === outPacketno) {
        toRemote('command', currBuffer())
        //console.log('to iot  ', packetno, '/', outPacketno, 'resend', currBuffer().length)
      }
      else if (packetno === nextPacketno(outPacketno)) {
        toRemote('command', nextBuffer())
        //console.log('to iot  ', packetno, '/', outPacketno, 'next', currBuffer().length)
      }
      else {
        //console.log('to iot  ', packetno, '/', outPacketno, 'IGNORE')
      }
    }
    else if (topic.endsWith('handshake')) {
      const inHandshakeInitiator = message.readUInt16BE()
      const inHandshakeFollower = message.readUInt16BE(2)
      // console.log('handshake <', [inHandshakeInitiator, inHandshakeFollower], [handshakeInitiator, handshakeFollower], handshaked)
      // console.log('handshakeWith', handshakeWith)
      if (!inHandshakeFollower) {
        if (
          inHandshakeInitiator === handshakeId
          || handshakeWith && handshakeWith !== inHandshakeInitiator
        ) return resetHandshake()
        else {
          handshakeInitiator = Math.max(inHandshakeInitiator, handshakeId)
          handshakeFollower = Math.min(inHandshakeInitiator, handshakeId)
          handshakeWith = inHandshakeInitiator
        }
      } else {
        if (inHandshakeInitiator === handshakeId || inHandshakeFollower === handshakeId) {
          handshakeInitiator = inHandshakeInitiator
          handshakeFollower = inHandshakeFollower
          handshakeWith = inHandshakeInitiator === handshakeId ? inHandshakeFollower : inHandshakeInitiator
        }
      }
      handshaked = handshakeInitiator && handshakeFollower
      // console.log('           ', [inHandshakeInitiator, inHandshakeFollower], [handshakeInitiator, handshakeFollower], handshaked)
      if (!inHandshakeFollower) toRemote('handshake', handshakeBuff())
      if (handshaked) console.log('handshaked')
    }
  })

  let handshakeId
  let handshakeInitiator
  let handshakeFollower
  let handshakeWith
  let handshaked
  let resetHandshake = () => {
    console.log('handshake')
    // handshakeId ranges from 1 to packetnoMax
    handshakeId = Math.ceil(1 + Math.random() * (packetnoMax - 1))
    handshakeInitiator = handshakeId
    handshakeFollower = 0
    handshakeWith = 0
    handshaked = false

    inPacketno = 1
    outPacketno = 0
    bufferCurr = emptyBuffer
    bufferNext = emptyBuffer
  }
  resetHandshake()
  const handshakeBuff = () => Buffer.concat([
    packetnoBuff(handshakeInitiator),
    packetnoBuff(handshakeFollower)
  ])
  setInterval(() => {
    if (!handshaked) {
      // console.log('handshake >', [handshakeInitiator, handshakeFollower])
      toRemote('handshake', handshakeBuff())
    }
    else
      toRemote('request', packetnoBuff(inPacketno))
  }, frequency)

  return send
}

module.exports = googleIoTControlled