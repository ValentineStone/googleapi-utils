
const symbolsAlpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const symbolsNum = '0123456789'
const symbolsOther = '~`!@#$%^&*()_-+={[}]|\:;"\'<,>.?/'
const symbolsOtherURL = '-_.~'
const symbolsDefault = symbolsAlpha + symbolsNum + symbolsOther

const getSymbols = arg => {
  switch (arg) {
    case '-alpha': return symbolsAlpha
    case '-num': return symbolsNum
    case '-alnum': return symbolsAlpha + symbolsNum
    case '-other': return symbolsOther
    case '-url': return symbolsAlpha + symbolsNum + symbolsOtherURL
    case '-any':
    case '':
    case undefined: return symbolsAlpha + symbolsNum + symbolsOther
    default: return arg
  }
}

const rchar = symbols => symbols[Math.floor(Math.random() * symbols.length)]

const rstring = (count, symbols) => {
  return new Array(count).fill('').map(v => rchar(symbols)).join('')
}

if (require.main === module) {
  const count = +process.argv[2] || 32
  const symbols = getSymbols(process.argv[3])
  const symbolsFirst = getSymbols(process.argv[4] || process.argv[3])
  let generated = rstring(count, symbols)
  if (symbolsFirst)
    generated = rchar(symbolsFirst) + generated.slice(1)
  console.log(generated)
}