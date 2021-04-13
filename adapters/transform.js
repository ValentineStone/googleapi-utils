'use strict'

const transform = (adapter, onRecv, onSend) => async recv => {
  const transformRecv = onRecv ? onRecv(recv) : recv
  const adapterSend = await adapter(transformRecv)
  const transformSend = onSend ? onSend(adapterSend) : adapterSend
  return transformSend
}

module.exports = transform