'use strict'

const serialport = (path, baudRate) => (recv, connected) => {
  const SerialPort = require('serialport')
  const serialport = new SerialPort(
    path,
    { baudRate, lock: false },
    () => connected(`${path}:${baudRate}`)
  )
  serialport.on('data', recv)
  const send = buff => serialport.write(buff)
  return send
}

module.exports = serialport