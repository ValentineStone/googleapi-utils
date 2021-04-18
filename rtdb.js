'use strict'
const { database } = require('./firebase')
const { jsonify } = require('./utils')
const { inspect } = require('util')

const cp = async (from, to, push) => {
  const fromGet = await database.ref(from).get()
  const toGet = await database.ref(to).get()
  if (!fromGet.exists())
    throw new Error(`Can not copy: ${from} does not exist`)
  if (!push && toGet.exists())
    throw new Error(`Can not copy: ${to} already exists`)
  if (push && !toGet.exists())
    throw new Error(`Can not copy and push: ${to} does not exist`)
  if (push) {
    console.log('copying...')
    const pushRef = await database.ref(to).push()
    await pushRef.set(fromGet.val())
    console.log('copied', from, 'to', `${to}/${pushRef.key}`)
  }
  else {
    console.log('copying...')
    await database.ref(to).set(fromGet.val())
    console.log('copied', from, 'to', to)
  }
}

const mv = async (from, to, push) => {
  const fromGet = await database.ref(from).get()
  const toGet = await database.ref(to).get()
  if (!fromGet.exists())
    throw new Error(`Can not move: ${from} does not exist`)
  if (!push && toGet.exists())
    throw new Error(`Can not move: ${to} already exists`)
  if (push && !toGet.exists())
    throw new Error(`Can not move and push: ${to} does not exist`)
  if (push) {
    console.log('moving...')
    const pushRef = await database.ref(to).push()
    await pushRef.set(fromGet.val())
    await database.ref(from).set(null)
    console.log('moved', from, 'to', `${to}/${pushRef.key}`)
  }
  else {
    console.log('moving...')
    await database.ref(to).set(fromGet.val())
    await database.ref(from).set(null)
    console.log('moved', from, 'to', to)
  }
}

const rm = async (path) => {
  const pathGet = await database.ref(path).get()
  if (!pathGet.exists())
    throw new Error(`Can not remove: ${path} does not exist`)
  console.log('removing...')
  await database.ref(path).set(null)
  console.log('removed', path)
}

const set = async (path, value, push) => {
  const pathGet = await database.ref(path).get()
  if (!push && pathGet.exists())
    throw new Error(`Can not set: ${path} already exists`)
  if (push && !pathGet.exists())
    throw new Error(`Can not set and push: ${to} does not exist`)
  if (push) {
    console.log('setting...')
    const pushRef = await database.ref(path).push()
    await pushRef.set(value)
    console.log('set', `${push}/${pushRef.key}`)
  }
  else {
    console.log('setting...')
    await database.ref(path).set(value)
    console.log('set', path)
  }
}

const get = async (path) => {
  console.log('getting...')
  const pathGet = await database.ref(path).get()
  const val = pathGet.val()
  const formatted = inspect(val, false, Infinity, true)
  console.log(formatted)
}

module.exports = { cp, mv, rm, set, get }

if (require.main === module) {
  const main = async () => {
    const action = process.argv[2]
    let args = process.argv.slice(3)
    if (action === 'mv') {
      const push = args[0] === '--push'
      if (push) args = args.slice(1)
      const from = args[0]
      const to = args[1]
      await mv(from, to, push)
    }
    else if (action === 'cp') {
      const push = args[0] === '--push'
      if (push) args = args.slice(1)
      const from = args[0]
      const to = args[1]
      await cp(from, to, push)
    }
    else if (action === 'rm') {
      const path = args[0]
      await rm(path)
    }
    else if (action === 'set') {
      const push = args[0] === '--push'
      if (push) args = args.slice(1)
      const path = args[0]
      const value = jsonify(args[1])
      await set(path, value, push)
    }
    else if (action === 'get') {
      const path = args[0]
      await get(path)
    }
    else {
      console.log('No such action:', action)
    }
  }
  main().catch(console.log).then(() => process.exit(0))
}