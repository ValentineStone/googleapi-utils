'use strict'
const connectSync = (adapter1, adapter2) => {
  let sendTo1
  const sendTo2 = adapter2(buff => sendTo1?.(buff))
  sendTo1 = adapter1(sendTo2)
}

module.exports = connectSync