const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  email: String,
  password: String,
  salt: String,
  activationCode: String,
  token: String,
  _createdAt: Date
})

module.exports = mongoose.model('Admin', schema)
