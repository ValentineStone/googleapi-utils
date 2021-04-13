'use strict'

const throttle = (adapter, interval, length = Infinity) => recv => {
  const adapterSend = adapter(recv)
  let accumulator = Buffer.from([])
  let timeOut = setTimeout(sendThrottled, interval)
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
  return send
}

module.exports = throttle