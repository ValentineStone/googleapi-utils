'use strict'
require('dotenv/config')
const uuid = require('uuid')
const uuid_namespace =
  process.env.UUID_NAMESPACE || 'e72bc52c-7700-11eb-9439-0242ac130002'

if (require.main === module) {
  const name = process.argv[2] || Date.now() + '-' + Math.random()
  const namespace = process.argv[3] || uuid_namespace
  console.log(uuid.v5(name, namespace))
}