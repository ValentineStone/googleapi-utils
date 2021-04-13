'use strict'
const adapters = require('./adapters')
const transforms = require('./transforms')

const deviceControlled = ({
  publicKey,
  privateKey,
  cloudRegion,
  credentials,
  frequency,
  keepalive,
  serialPath,
  serialBaudRate,
}) => adapters.connect(
  adapters.serialport(
    serialPath,
    serialBaudRate,
    console.log
  ),
  adapters.googleIoTControlled({
    mode: 'device',
    publicKey,
    privateKey,
    cloudRegion,
    credentials,
    frequency,
    keepalive,
    connected: console.log
  })
)

const deviceMavlink = ({
  publicKey,
  privateKey,
  cloudRegion,
  credentials,
  serialPath,
  serialBaudRate,
  interval,
  buffer,
}) => adapters.connect(
  adapters.transform(
    adapters.serialport(
      serialPath,
      serialBaudRate,
      console.log
    ),
    transforms.mavlink(),
    transforms.mavlink()
  ),
  adapters.throttle(
    adapters.googleIoT({
      mode: 'device',
      publicKey,
      privateKey,
      cloudRegion,
      credentials,
      connected: console.log
    }),
    interval,
    buffer
  )
)

const proxyControlled = ({
  publicKey,
  privateKey,
  cloudRegion,
  credentials,
  gcsHost,
  gcsPort,
  frequency,
  keepalive,
}) => adapters.connect(
  adapters.udpProxy(
    gcsHost,
    gcsPort,
    console.log
  ),
  adapters.googleIoTControlled({
    mode: 'proxy',
    publicKey,
    privateKey,
    cloudRegion,
    credentials,
    frequency,
    keepalive,
    connected: console.log
  })
)

const proxy = ({
  publicKey,
  privateKey,
  cloudRegion,
  credentials,
  gcsHost,
  gcsPort,
  interval,
  buffer,
  logRecv,
}) => adapters.connect(
  adapters.udpProxy(
    gcsHost,
    gcsPort,
    console.log
  ),
  adapters.transform(
    adapters.throttle(
      adapters.googleIoT({
        mode: 'proxy',
        publicKey,
        privateKey,
        cloudRegion,
        credentials,
        connected: console.log
      }),
      interval,
      buffer,
    ),
    recv => buff => {
      if (logRecv) console.log(
        logRecv,
        buff.length,
        ...(buff.length ? ['< ' + buff[0].toString(16) + ' ... >'] : [])
      )
      recv(buff)
    }
  ),
)

const udpToSerial = ({
  udpHost,
  udpPort,
  serialPath,
  serialBaudRate,
}) => adapters.connect(
  adapters.udp(
    udpHost,
    udpPort,
    console.log
  ),
  adapters.serialport(
    serialPath,
    serialBaudRate,
    console.log
  )
)

const udpToSerialMeasured = ({
  udpHost,
  udpPort,
  serialPath,
  serialBaudRate,
  interval,
  recvName,
  sendName,
  logRecv,
  logSend,
}) => adapters.connect(
  adapters.udp(
    udpHost,
    udpPort,
    console.log
  ),
  adapters.transform(
    adapters.measure(
      adapters.serialport(
        serialPath,
        serialBaudRate,
        console.log
      ),
      interval,
      sendName,
      recvName,
    ),
    recv => buff => {
      if (logRecv) console.log(recvName, buff.length, buff)
      recv(buff)
    },
    send => buff => {
      if (logSend) console.log(sendName, buff.length, buff)
      send(buff)
    }
  )
)

const ignoreErrors = error => undefined

const loadEnv = async assignEnv =>
  await require('./zipenv')('keys.zip', assignEnv).catch(async () => {
    const fs = require('fs/promises')
    const envData = await fs.readFile('.env')
    const env = require('dotenv').parse(envData)
    if (assignEnv)
      Object.assign(process.env, env)
    const [
      credentialsData,
      publicKey,
      privateKey
    ] = await Promise.all([
      fs.readFile(env.GOOGLE_APPLICATION_CREDENTIALS).catch(ignoreErrors),
      fs.readFile(env.PUBLIC_KEY_FILE).catch(ignoreErrors),
      fs.readFile(env.PRIVATE_KEY_FILE).catch(ignoreErrors),
    ])
    const credentials = credentialsData && JSON.parse(credentialsData)
    return {
      env,
      publicKey,
      privateKey,
      credentials,
    }
  })

if (require.main === module) {
  (async () => {
    const {
      env,
      publicKey,
      privateKey,
      credentials,
    } = await loadEnv(false)
    const mode = process.argv[2] || 'proxy'
    if (mode === 'proxy_c') {
      const gcsHost = process.argv[3] || env.PROXY_UDP_GCS_HOST
      const gcsPort = process.argv[4] || +env.PROXY_UDP_GCS_PORT
      proxyControlled({
        publicKey,
        privateKey,
        cloudRegion: env.CLOUD_REGION,
        credentials,
        frequency: +env.IOT_CONNECTION_FREQUENCY,
        keepalive: +env.IOT_CONNECTION_KEEPALIVE,
        gcsHost,
        gcsPort,
      })
    }
    else if (mode === 'device_c') {
      const serialPath = process.argv[3] || env.DEVICE_SERIAL_PATH
      const serialBaudRate = process.argv[4] || +env.DEVICE_SERIAL_BAUD
      deviceControlled({
        publicKey,
        privateKey,
        cloudRegion: env.CLOUD_REGION,
        credentials,
        frequency: +env.IOT_CONNECTION_FREQUENCY,
        keepalive: +env.IOT_CONNECTION_KEEPALIVE,
        serialPath,
        serialBaudRate,
      })
    }
    else if (mode === 'proxy') {
      const gcsHost = process.argv[3] || env.PROXY_UDP_GCS_HOST
      const gcsPort = process.argv[4] || +env.PROXY_UDP_GCS_PORT
      const logRecv = (process.argv[5] === undefined
        ? 'from device:'
        : (process.argv[5] === 'nolog'
          ? undefined :
          process.argv[5]
        )
      )
      proxy({
        publicKey,
        privateKey,
        cloudRegion: env.CLOUD_REGION,
        credentials,
        gcsHost,
        gcsPort,
        interval: +env.IOT_THROTTLE_INTERVAL,
        buffer: +env.IOT_THROTTLE_BUFFER,
        logRecv,
      })
    }
    else if (mode === 'device') {
      const serialPath = process.argv[3] || env.DEVICE_SERIAL_PATH
      const serialBaudRate = process.argv[4] || +env.DEVICE_SERIAL_BAUD
      deviceMavlink({
        publicKey,
        privateKey,
        cloudRegion: env.CLOUD_REGION,
        credentials,
        serialPath,
        serialBaudRate,
        interval: +env.IOT_THROTTLE_INTERVAL,
        buffer: +env.IOT_THROTTLE_BUFFER,
      })
    }
    else if (mode === 'serial-udp') {
      const serialPath = process.argv[3] || env.DEVICE_SERIAL_PATH
      const serialBaudRate = +(process.argv[4] || env.DEVICE_SERIAL_BAUD)
      const udpHost = process.argv[5] || env.DEVICE_UDP_HOST
      const udpPort = +(process.argv[6] || env.DEVICE_UDP_PORT)
      const interval = +process.argv[7] || undefined
      const recvName = process.argv[8] || 'recv'
      const sendName = process.argv[9] || 'send'
      const logRecv = (process.argv[10] || 'recv,send').includes('recv')
      const logSend = (process.argv[10] || 'recv,send').includes('send')
      if (interval) {
        udpToSerialMeasured({
          udpHost,
          udpPort,
          serialPath,
          serialBaudRate,
          interval,
          recvName,
          sendName,
          logRecv,
          logSend,
        })
      } else {
        udpToSerial({
          udpHost,
          udpPort,
          serialPath,
          serialBaudRate,
        })
      }
    }
  })()
}