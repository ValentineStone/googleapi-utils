'use strict'

const jsonify = str => {
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}

module.exports = {
  jsonify
}