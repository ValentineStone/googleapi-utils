'use strict'

const expand = (arr, expanded = []) => {
  for (const item of arr)
    if (Array.isArray(item))
      expand(item, expanded)
    else
      expanded.push(item)
  return expanded
}
const chain = async (..._adapters) => {
  const connect = require('./connect')
  const adapters = expand(_adapters)
  const promises = []
  for (let i = 0; i < adapters.length; i += 2)
    promises.push(connect(adapters[i], adapters[i + 1]))
  await Promise.all(promises)
}

module.exports = chain