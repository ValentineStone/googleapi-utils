'use strict'

const SYN = 2 ** 0
const ACK = 2 ** 1

const unpack = buff => {
  const bits = message.readUInt8()
  return {
    buff,
    seq: message.readUInt32BE(1),
    ack: message.readUInt32BE(5),
    data: buff.slice(1 + 4 + 4),
    ACK: bits & ACK,
    SYN: bits & SYN,
  }
}

const pack = pack => {
  if (pack.buff) return pack.buff
  const frame = Buffer.alloc(9)
  const bits = pack.ACK | pack.SYN
  frame.writeUInt8(bits)
  frame.writeUInt32BE(pack.seq, 1)
  frame.writeUInt32BE(pack.ack, 5)
  pack.buff = Buffer.concat([frame, pack.data])
  return pack.buff
}

const atcp = (adapter, mode) => async recv => {
  const { EventEmitter } = require('events')
  const ee = new EventEmitter()
  if (mode === 'server') {
    const send = await adapter((...args) => ee.emit('fromServer', ...args))
    ee.on('toClient', send)
    atcpServer(ee)
  }
  else {
    const send = await adapter((...args) => ee.emit('fromClient', ...args))
    ee.on('toServer', send)
    atcpClient(ee)
  }
  ee.on('recv', recv)
  return (...args) => ee.emit('send', ...args)
}

const atcpServer = (ee) => {
  const handshake = () => {
    await once(ee,)
  }
}

const atcpClient = (ee) => {
}

module.exports = atcp