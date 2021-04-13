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

const googleIoT = ({
  mode,
  publicKey,
  privateKey,
  credentials,
  cloudRegion,
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

  client.on('message', (topic, message) => {
    recv(message, topic)
  })

  const send = (buff, topic) => {
    iotClient.sendCommandToDevice({
      name: remotePath,
      binaryData: buff,
      ...(topic === undefined ? null : { subfolder: topic })
    }).catch(ignoreErrors)
  }

  return send
}

module.exports = googleIoT