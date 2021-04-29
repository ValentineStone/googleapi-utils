'use strict'
const adapters = require('./adapters')
const transforms = require('./transforms')
const { timeout } = require('./utils')

const devicePubSub = ({
  uuid,
  credentials,
  serialPath,
  serialBaudRate,
  interval,
  buffer,
}) => adapters.connect(
  adapters.serialport(
    serialPath,
    serialBaudRate,
    console.log
  ),
  adapters.throttle(
    adapters.pubsub({
      mode: 'device',
      credentials,
      uuid,
      connected: console.log
    }),
    interval,
    buffer
  )
)

const proxyPubSub = ({
  uuid,
  credentials,
  gcsHost,
  gcsPort,
  interval,
  buffer,
  logRecv,
  logRecvTimeout = 0,
  logRecvWarning = ''
}) => {
  const noDataTimeout = timeout(() => {
    if (logRecvWarning) console.log(logRecvWarning)
  }, logRecvTimeout)
  return adapters.connect(
    adapters.udpProxy(
      gcsHost,
      gcsPort,
      console.log
    ),
    adapters.transform(
      //adapters.throttle(
        adapters.pubsub({
          mode: 'proxy',
          uuid,
          credentials,
          connected: (...args) => {
            if (logRecv && logRecvTimeout) noDataTimeout()
            console.log(...args)
          }
        }),
      //  interval,
      //  buffer,
      //),
      recv => {
        return buff => {
          if (logRecv && logRecvTimeout) noDataTimeout()
          if (logRecv) console.log(
            logRecv,
            buff.length,
            ...(buff.length ? ['< ' + buff[0].toString(16) + ' ... >'] : [])
          )
          recv(buff)
        }
      }
    ),
  )
}

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
    if (mode === 'proxy') {
      const uuid = env.DEVICE_UUID
      const gcsHost = process.argv[3] || env.PROXY_UDP_GCS_HOST
      const gcsPort = process.argv[4] || +env.PROXY_UDP_GCS_PORT
      const logRecv = (process.argv[5] === undefined
        ? 'from device:'
        : (process.argv[5] === 'nolog'
          ? undefined :
          process.argv[5]
        )
      )
      const logRecvTimeout = +process.argv[6] || +env.PROXY_LOG_RECV_TIMEOUT
      const logRecvMessage = +process.argv[7] || +env.PROXY_LOG_RECV_WARNING
      proxyPubSub({
        uuid,
        credentials,
        gcsHost,
        gcsPort,
        interval: +env.IOT_THROTTLE_INTERVAL,
        buffer: +env.IOT_THROTTLE_BUFFER,
        logRecv,
        logRecvTimeout,
        logRecvMessage
      })
    }
    else if (mode === 'device') {
      const serialPath = process.argv[3] || env.DEVICE_SERIAL_PATH
      const serialBaudRate = process.argv[4] || +env.DEVICE_SERIAL_BAUD
      devicePubSub({
        uuid,
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
      udpToSerial({
        udpHost,
        udpPort,
        serialPath,
        serialBaudRate,
      })
    }
  })()
}