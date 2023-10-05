'use strict'

require('dotenv/config')
const firebase = require('firebase-admin')
firebase.initializeApp({
  databaseURL: process.env.FIREBASE_DATABASE_URL
})

module.exports = {
  firebase,
  get auth() { return firebase.auth() },
  get database() { return firebase.database() },
}