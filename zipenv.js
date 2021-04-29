'use strict'

const nodebufferUnzip = file => file ? file.async('nodebuffer') : file

const zipenv = async (zipFile, assignEnv = true) => {
  const zip = await require('jszip').loadAsync(
    require('fs').readFileSync(zipFile))
  const files = {}
  for (const file in zip.files) {
    const parts = file.split('/')
    const filename = parts[parts.length - 1]
    files[filename] = zip.files[file]
  }
  const [
    envData,
    credentialsData,
    privateKey,
    publicKey,
  ] = await Promise.all([
    nodebufferUnzip(files['.env']),
    nodebufferUnzip(files['credentials.json']),
    nodebufferUnzip(files['ec_private.pem']),
    nodebufferUnzip(files['ec_public.pem']),
  ])
  const credentials = JSON.parse(credentialsData)
  const env = require('dotenv').parse(envData)
  if (assignEnv)
    Object.assign(process.env, env)
  return {
    credentials,
    privateKey,
    publicKey,
    env
  }
}

module.exports = zipenv