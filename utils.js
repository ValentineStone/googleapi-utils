const interval = (fn, ms) => {
  let id
  return () => {
    clearInterval(id)
    id = setInterval(fn, ms)
  }
}

const timeout = (fn, ms) => {
  let id
  return () => {
    clearTimeout(id)
    id = setTimeout(fn, ms)
  }
}

const jsonify = str => {
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}

module.exports = {
  interval,
  timeout,
  jsonify
}