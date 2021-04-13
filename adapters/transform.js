'use strict'

const transform = (adapter, onRecv, onSend) => recv => {
  const transformRecv = onRecv ? onRecv(recv) : recv
  const adapterSend = adapter(transformRecv)
  const transformSend = onSend ? onSend(adapterSend) : adapterSend
  return transformSend
}

module.exports = transform