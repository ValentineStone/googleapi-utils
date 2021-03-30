'use strict'
const adapters = require('./adapters')

const device = ({
  publicKey,
  privateKey,
  cloudRegion,
  credentials,
  frequency,
  serialPath,
  serialBaudRate,
}) => adapters.connect(
  adapters.serialport(
    serialPath,
    serialBaudRate
  ),
  adapters.googleIoT({
    mode: 'device',
    publicKey,
    privateKey,
    cloudRegion,
    credentials,
    frequency,
  }),
  console.log
)

const proxy = ({
  publicKey,
  privateKey,
  cloudRegion,
  credentials,
  frequency,
  gcsHost,
  gcsPort,
}) => adapters.connect(
  adapters.udpProxy(
    gcsHost,
    gcsPort
  ),
  adapters.googleIoT({
    mode: 'proxy',
    publicKey,
    privateKey,
    cloudRegion,
    credentials,
    frequency,
  }),
  console.log
)

const udpToSerial = ({
  udpHost,
  udpPort,
  serialPath,
  serialBaudRate,
}) => adapters.connect(
  adapters.udp(
    udpHost,
    udpPort
  ),
  adapters.serialport(
    serialPath,
    serialBaudRate
  ),
  console.log
)

if (require.main === module) {
  (async () => {
    const {
      env,
      publicKey,
      privateKey,
      credentials,
    } = await require('./zipenv')('keys.zip', false)
    const mode = process.argv[2] || 'proxy'
    if (mode === 'proxy') {
      const gcsHost = process.argv[3] || env.PROXY_UDP_GCS_HOST
      const gcsPort = process.argv[4] || +env.PROXY_UDP_GCS_PORT
      proxy({
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
    else if (mode === 'device') {
      const serialPath = process.argv[3] || env.DEVICE_SERIAL_PATH
      const serialBaudRate = process.argv[4] || +env.DEVICE_SERIAL_BAUD
      device({
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
    else if (mode === 'serial-udp') {
      const serialPath = process.argv[3] || env.DEVICE_SERIAL_PATH
      const serialBaudRate = +(process.argv[4] || env.DEVICE_SERIAL_BAUD)
      const udpHost = process.argv[5] || env.DEVICE_UDP_HOST
      const udpPort = +(process.argv[6] || env.DEVICE_UDP_PORT)
      udpToSerial({
        udpHost,
        udpPort,
        serialPath,
        serialBaudRate,
      })
    }
  })()
}

module.exports = {
  proxy,
  device,
  udpToSerial,
}