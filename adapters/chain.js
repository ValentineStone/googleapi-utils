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
  for (let i = 0; i < adapters.length; i += 2)
    connect(adapters[i], adapters[i + 1])
}

module.exports = chain