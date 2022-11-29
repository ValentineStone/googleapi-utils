'use strict'
const { auth } = require('./firebase')
const { jsonify } = require('./utils')

const claimSingle = async (uid, claim, value) => {
  if (claim) {
    if (claim === '--clear') {
      await auth.setCustomUserClaims(uid, null)
      const { customClaims } = await auth.getUser(uid)
      console.log(uid, '=', customClaims)
    }
    else if (value === '--clear') {
      const { customClaims } = await auth.getUser(uid)
      await auth.setCustomUserClaims(uid, { ...customClaims, [claim]: undefined })
      console.log(uid, claim, '=', undefined)
    }
    else if (value !== undefined) {
      const { customClaimsOld } = await auth.getUser(uid)
      await auth.setCustomUserClaims(uid, { ...customClaimsOld, [claim]: value })
      const { customClaims } = await auth.getUser(uid)
      console.log(uid, claim, '=', customClaims[claim])
    } else {
      const { customClaims } = await auth.getUser(uid)
      console.log(uid, claim, '=', customClaims[claim])
    }
  }
  else {
    const { customClaims } = await auth.getUser(uid)
    console.log(uid, '=', customClaims)
  }
}

const claimMultiple = async (uid, claim, value) => {
  if (uid.includes(',')) {
    const uids = uid.split(',')
    return await Promise.all(uids.map(uid => claimSingle(uid, claim, value)))
  } else
    return await claimSingle(uid, claim, value)
}

if (require.main === module) {
  const uid = process.argv[2]
  const claim = process.argv[3]
  const value = jsonify(process.argv[4])
  claimMultiple(uid, claim, value)
    .then(() => process.exit())
}

module.exports = claimMultiple