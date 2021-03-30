'use strict'
require('dotenv/config')
const firebase = require('firebase-admin')
firebase.initializeApp()
const auth = firebase.auth()

module.exports = { firebase, auth }