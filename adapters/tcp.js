'use strict'

const tcp = (addr, port, connected) => recv => {
  const clients = new Set()
  const server = require('net').createServer(client => {
    clients.add(client)
    client.on('data', recv)
    client.on('error', console.log)
    client.on('close', () => {
      clients.delete(client)
      client.removeAllListeners('data')
    })
  })
  server.listen(port, addr, () => connected?.(`${addr}:${port}`))
  server.on('error', console.log)

  const send = data => clients.forEach(cl => cl.write(data))
  return send
}

module.exports = tcp