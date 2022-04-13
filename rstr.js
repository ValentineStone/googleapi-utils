const symbolsDefault = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789~`!@#$%^&*()_-+={[}]|\:;"\'<,>.?/'
const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

const rchar = symbols => symbols[Math.floor(Math.random() * symbols.length)]

const rstring = (count, symbols) => {
  return new Array(count).fill('').map(v => rchar(symbols)).join('')
}

if (require.main === module) {
  const count = +process.argv[2] || 32
  const symbols = process.argv[3] || symbolsDefault
  const symbolsFirst = process.argv[4]
    || (symbols === symbolsDefault ? letters : false)
  let generated = rstring(count, symbols)
  if (symbolsFirst)
    generated = rchar(symbolsFirst) + generated.slice(1)
  console.log(generated)
}