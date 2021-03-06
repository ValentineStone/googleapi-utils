'use strict'

const measure = (adapter, interval, recvName, sendName) => async recv => {
  let lengthSend = 0
  let lengthRecv = 0
  let sendTick = 0
  let recvTick = 0
  let avgSend = 0
  let avgRecv = 0
  let maxSend = 0
  let maxRecv = 0

  const tick = () => {
    if (lengthSend) {
      const prevTick = sendTick++
      avgSend = (avgSend * prevTick + lengthSend) / sendTick
      maxSend = lengthSend > maxSend ? lengthSend : maxSend
    }
    if (lengthRecv) {
      const prevTick = recvTick++
      avgRecv = (avgRecv * prevTick + lengthRecv) / recvTick
      maxRecv = lengthRecv > maxRecv ? lengthRecv : maxRecv
    }
    console.log(
      sendName,
      `(x${sendTick}):`,
      `avg=${avgSend.toFixed(2)},`,
      `max=${maxSend},`,
      `cur=${lengthSend};`,
      recvName,
      `(x${recvTick}):`,
      `avg=${avgRecv.toFixed(2)},`,
      `max=${maxRecv},`,
      `cur=${lengthRecv}`,
    )

    lengthSend = 0
    lengthRecv = 0
  }

  setInterval(tick, interval)
  const adapterRecv = buff => {
    lengthRecv += buff.length
    recv(buff)
  }
  const adapterSend = await adapter(adapterRecv)
  const send = buff => {
    lengthSend += buff.length
    adapterSend(buff)
  }
  return send
}

module.exports = measure