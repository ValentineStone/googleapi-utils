'use strict'

const udp_proxy = (host, port) => (recv, connected) => {
  const dgram = require('dgram')
  const socket = dgram.createSocket('udp4')
  socket.on('listening', () => {
    const addr = socket.address()
    connected(`${addr.address}:${addr.port} > ${host}:${port}`)
  })
  socket.bind()
  socket.on('message', recv)
  const send = buff =>
    socket.send(buff, port, host)
  return send
}

module.exports = udp_proxy