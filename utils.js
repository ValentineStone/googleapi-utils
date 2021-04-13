const interval = (fn, ms) => {
  let id
  const start = () => {
    id = setInterval(fn, ms)
    return clear
  }
  const clear = () => {
    clearInterval(id)
    return start
  }
  return start()
}

module.exports = {
  interval
}