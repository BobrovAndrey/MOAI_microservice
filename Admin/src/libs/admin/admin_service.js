const crypto = require('crypto')
const mongoose = require('mongoose')

const sms = require('./helper/sms')

/**
 * Will create new Admin
 * @param {String} [email]
 * @param {String} [password]
 */
const createAdmin = Admin => async (email, password) => {
  const serviceName = 'createAdmin'
  try {
    const emailVerification = await Admin.find({ email: email })
    if (emailVerification[0]) throw Error('<Email Verification error>: Admin with same email already exist ')

    const cryptoPass = await passwordCrypto(password)
    if (cryptoPass instanceof Error) throw Error('<Crypto pass error> :', emailVerification)
    if (!cryptoPass.passwordHash || !cryptoPass.passwordSalt) throw Error('<Crypto pass error> :', `Salt or hash are empty: ${cryptoPass}`)

    const admin = new Admin({
      email,
      password: cryptoPass.passwordHash,
      salt: cryptoPass.passwordSalt,
      _createdAt: new Date()
    })

    await admin.save()

    await sms(email, `Administrator created`, `<h2>Dear Administrator, your password is: ${password}. Best wishes.</h2>`, serviceName)

    return `Successfully created with id: ${admin._id}`
  } catch (err) {
    return err
  }
}

/**
 * Will return cryptographic password instance
 * @param {String} [password]
 */
const passwordCrypto = async (password) => {
  try {
    const passwordSalt = crypto.randomBytes(16).toString('hex')
    const hmac = crypto.createHmac('sha512', passwordSalt)
    await hmac.update(password)
    const passwordHash = hmac.digest('hex')

    const payload = {
      passwordHash,
      passwordSalt
    }

    return payload
  } catch (err) {
    return err
  }
}

/**
 * Will return Admins list
 */
const getAdmins = Admin => async () => {
  // return new Promise((resolve, reject) => {
  //   AdminModel.find({})
  //     .then(result => resolve(result))
  //     .catch(err => reject(new Error(`<Get Admins list> error:, ${err}`)))
  // })
  try {
    return Admin.find({})
  } catch (err) {
    return err
  }
}

/**
 * Wil compare reference and incoming passwords using crypto
 * @param {String} [salt]
 * @param {String} [referencePassword]
 * @param {String} [incomingPassword]
 */
const passwordComparison = async (salt, referencePassword, incomingPassword) => {
  try {
    const hmac = crypto.createHmac('sha512', salt)
    hmac.update(incomingPassword)

    const loginPasswordHash = hmac.digest('hex')
    if (loginPasswordHash !== referencePassword) return false
    return true
  } catch (err) {
    return err
  }
}

/**
 * Will return new token 32 bytes long
 *
 */
const newToken = async () => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Will update Admin with specified query params and payload
 * @param {Object} [queryParams] query params Mongoose .find(**queryParams**)
 * @param {Object} [updatePayload] update params for Mongoose .update (**updatePayload**)
 */
const updateAdmin = Admin => async (queryParams, updatePayload) => {
  try {

    const adminResult = await Admin.find(queryParams)
    if (!adminResult || !adminResult[0] || !adminResult[0]._id) throw Error(`Admin ${JSON.stringify(queryParams)} wasn't found`)

    const updateResult = await adminResult[0].updateOne(updatePayload)
    if (updateResult.nModified < 1) throw Error(`Admin has not been updated correctly. Maybe you trying to update Admin with same value.`)

    return updateResult
  } catch (err) {
    return err
  }
}

/**
 * Will return validation result.
 * @param {String} [id]
 */
const idValidation = async (id) => {
  return mongoose.Types.ObjectId.isValid(id)
}

/**
 * Will return Admin with specified query params
 * @param {Object} [query] Admin.find(**query**)
 */
const findAdmin = Admin => async (query) => {
  return Admin.find(query)
}

/**
 * Will clear Admin list table and return deleted count
 */
const deleteAdminList = Admin => async () => {
  try {
    const result = await Admin.deleteMany()
    const deleted = result.deletedCount
    return deleted
  } catch (err) {
    return err
  }
}

/**
 * Will update Admin with 'null' token
 * @param {String} [token]
 */
const adminLogout = async (token) => {
  try {
    const result = await updateAdmin({ token: token }, { token: null })

    if (result.nModified < 1) return false
    return true
  } catch (err) {
    return err
  }
}

const deleteAdminById = Admin => async (id) => {
  const result = await Admin.findByIdAndDelete(id)
  if (!result || !result._id) return Error(`Admin ${id} wasn't found.`)
  return result
}

/**
 * Main Admin login logic. Will return Admin after updating with new token.
 * @param {String} [adminEmail]
 * @param {String} [adminPassword]
 */
const adminUpdateToken = Admin => async (adminEmail, adminPassword) => {
  try {
    // Validation
    if (!adminEmail) throw Error('Required field are missing: adminEmail')
    if (!adminPassword) throw Error('Required field are missing: adminPassword')

    // IsAdminExist
    const sameAdmin = await Admin.find({ email: adminEmail })
    if (!sameAdmin || !sameAdmin[0] || !sameAdmin[0]._id) throw Error(`Admin ${adminEmail} was not found.`)

    // Password comparison
    const passwordResult = await passwordComparison(sameAdmin[0].salt, sameAdmin[0].password, adminPassword)
    if (!passwordResult) throw Error(`Admin password ${adminPassword} is incorrect.`)

    // Generate token
    const token = await newToken()
    if (token instanceof Error) throw Error(`Token has not been generated correctly.`)

    // Update Admin with new token
    const updateAdminResult = await Admin.findOneAndUpdate({ email: adminEmail }, { token: token })
    if (!updateAdminResult._id) throw Error(`Admin ${adminEmail} has not been updated correctly. Result is ${JSON.stringify(updateAdminResult)} `)

    // Result
    const resultAdmin = await Admin.find({ email: adminEmail })

    return (resultAdmin)
  } catch (err) {
    return (err)
  }
}

// Will return higher order functions for init model outside service file.
module.exports = Admin => {
  return {
    getAdmins: getAdmins(Admin),
    createAdmin: createAdmin(Admin),
    passwordCrypto,
    adminUpdateToken: adminUpdateToken(Admin),
    deleteAdminList: deleteAdminList(Admin),
    adminLogout,
    findAdmin: findAdmin(Admin),
    idValidation,
    updateAdmin: updateAdmin(Admin),
    deleteAdminById: deleteAdminById(Admin),
    passwordComparison,
    newToken
  }
}
