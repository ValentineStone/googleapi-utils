'use strict'
const stub = () => { }
const connect = async (
  adapter1,
  adapter2,
  connected1,
  connected2
) => {
  let sendTo1
  const sendTo2 = await adapter2(
    buff => sendTo1?.(buff),
    connected1 || stub
  )
  sendTo1 = await adapter1(
    sendTo2,
    connected2 || connected1 || stub
  )
}

module.exports = connect