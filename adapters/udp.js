'use strict'

const udp = (host, port) => (recv, connected) => {
  const dgram = require('dgram')
  const socket = dgram.createSocket('udp4')
  let rinfo = null
  socket.on('listening', () => {
    connected(`${host}:${port} > unknown`)
    socket.once('message', (msg, _rinfo) => {
      rinfo = _rinfo
      connected(`${host}:${port} > ${rinfo.address}:${rinfo.port}`)
    })
  })
  socket.bind(port, host)
  socket.on('message', recv)
  const send = buff => rinfo &&
    socket.send(buff, rinfo.port, rinfo.address)
  return send
}

module.exports = udp