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

if (require.main === module) {
  const adapter1 = process.argv[2]
  const adapter1Params = process.argv[3]
  const adapter2 = process.argv[4]
  const adapter2Params = process.argv[5]
  const { jsonify } = require('../utils')
  const parseParams = str => {
    try {
      const json = JSON.parse(str)
      return Array.isArray(json) ? json : [json]
    } catch {
      return str.split(',').map(jsonify)
    }
  }

  connect(
    require(`./${adapter1}`)(
      ...parseParams(adapter1Params),
      (...args) => console.log(`[${adapter1}]:`, ...args)
    ),
    require('./' + adapter2)(
      ...parseParams(adapter2Params),
      (...args) => console.log(`[${adapter2}]:`, ...args)
    ),
  )
}