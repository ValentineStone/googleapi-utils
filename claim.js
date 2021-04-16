'use strict'
const { auth } = require('./firebase')
const { jsonify } = require('./utils')

async function main(uid, claim, value) {
  if (claim) {
    await auth.setCustomUserClaims(uid, { [claim]: value })
    console.log('set', claim, '=', value, 'for', uid)
  }
  else {
    const user = await auth.getUser(uid)
    console.log(uid, 'claims', user.customClaims)
  }
}

if (require.main === module) {
  const uid = process.argv[2]
  const claim = process.argv[3]
  const value = jsonify(process.argv[4])
  main(uid, claim, value)
    .then(() => process.exit())
}

module.exports = main