'use strict'

const throttle = (adapter, interval, length = Infinity) => async recv => {
  const adapterSend = await adapter(recv)
  let accumulator = Buffer.from([])
  const sendThrottled = () => {
    if (accumulator.length) {
      const buff = accumulator
      accumulator = Buffer.from([])
      adapterSend(buff)
    }
    clearTimeout(timeOut)
    timeOut = setTimeout(sendThrottled, interval)
  }
  const send = buff => {
    accumulator = Buffer.concat([accumulator, buff])
    if (accumulator.length > length)
      sendThrottled()
  }
  let timeOut = setTimeout(sendThrottled, interval)
  return send
}

module.exports = throttle