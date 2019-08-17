const passport = require('passport')
const BasicStrategy = require('passport-http').BasicStrategy
const BearerStrategy = require('passport-http-bearer')

const { adminUpdateToken } = require('../src/libs/admin')
const Admin = require('../src/libs/admin/admin_model')

passport.use('adminBasic', new BasicStrategy(async (adminEmail, password, done) => {
  try {
    const adminResult = await adminUpdateToken(adminEmail, password)
    if (!adminResult) throw Error(`Error during 'adminUpdateToken' query. ${adminEmail}`)
    done(null, adminResult)
  } catch (err) {
    done(null, false)
  }
}))

passport.use('adminBearer', new BearerStrategy(async (token, done) => {
  try {
    const adminResult = await Admin.findOne({ token: token })
    if (!adminResult) throw Error(`Admin with token ${token} was not found`)
    done(null, adminResult)
  } catch (err) {
    done(null, false)
  }
}))

module.exports = {
  connect (app) {
    app.use(passport.initialize())
    app.use(passport.session())
  }
}
