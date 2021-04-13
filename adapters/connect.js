'use strict'
const connect = async (
  adapter1,
  adapter2,
) => {
  let sendTo1
  const sendTo2 = await adapter2(
    buff => sendTo1?.(buff)
  )
  sendTo1 = await adapter1(
    sendTo2
  )
}

module.exports = connect