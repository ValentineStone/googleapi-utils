if (require.main === module) {
  const from = Date.parse(process.argv[2] || '1990-01-01')
  const to = Date.parse(process.argv[3] || '1999-12-31')
  const date = new Date(from + (to - from) * Math.random())
  const str = date.toISOString().replace(/T/g, ' ').replace(/\..*/g, '')
  console.log(str)
}