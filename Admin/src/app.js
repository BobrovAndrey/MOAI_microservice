const express = require('express')
const app = express()
const router = express.Router()

// Body parser
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Router init
app.use('/admin/v1', router)

// Logic
const { createAdmin, getAdmins, deleteAdminList, adminLogout, idValidation, updateAdmin, deleteAdminById } = require('../src/libs/admin')

// Passport
const passport = require('passport')
require('../config/passportSetup').connect(app)

const adminBasic = passport.authenticate('adminBasic', { session: false })
const adminBearer = passport.authenticate('adminBearer', { session: false })

// Responses
const { missResponse, negResponse, posResponse } = require('../src/libs/admin/helper/response')

// Routes
router.route('/admin')
  .get(adminBearer, async (req, res, next) => {
    try {
      const admins = await getAdmins()
      res.status(200).send(admins)
    } catch (err) {
      next(err)
    }
  })
  .post(async (req, res, next) => {
    // Service Name
    const serviceName = 'Create Admin'

    // If req.body doesn't filled
    if (!req.body) return res.status(400).send(await missResponse(serviceName, 'Please fill up request body'))

    // If req.body exist
    const { email, password } = req.body

    if (!email) return res.status(400).send(await missResponse(serviceName, 'email'))
    if (!password) return res.status(400).send(await missResponse(serviceName, 'password'))

    // Logic
    try {
      const admin = await createAdmin(email, password)
      if (!admin || admin instanceof Error) return res.status(400).send(await negResponse(serviceName, admin))

      res.status(200).send(await posResponse(serviceName, admin))
    } catch (err) {
      next(err)
    }
  })
  .delete(adminBearer, async (req, res, next) => {
    const serviceName = 'deleteAdmin'
    try {
      // Passport error handling
      if (req.user instanceof Error) return res.status(400).send(await negResponse(serviceName, req.user.message))

      const result = await deleteAdminList()
      if (result instanceof Error) return res.status(400).send(await negResponse(serviceName, `Admins has not been deleted correctly. Result is: ${result}`))

      res.status(200).send(await posResponse(serviceName, `Admins table was successfully cleared. Admins deleted: ${result} `))
    } catch (err) {
      next(err)
    }
  })

router.route('/adminLogin')
  .post(adminBasic, async (req, res, next) => {
    const serviceName = 'adminLogin'
    try {
      // Passport error handling
      if (req.user instanceof Error) return res.status(400).send(await negResponse(serviceName, req.user.message))

      // Payload
      const response = {}
      response.token = req.user[0].token
      response.user = {}
      response.user._id = req.user[0]._id
      response.user.firstName = req.user[0].firstName
      response.user.lastName = req.user[0].lastName
      response.user.email = req.user[0].email

      res.status(200).send(response)
    } catch (err) {
      next(err)
    }
  })
router.route('/adminLogout')
  .post(adminBearer, async (req, res, next) => {
    const serviceName = 'adminLogout'
    try {
      // Passport error handling
      if (req.user instanceof Error) return res.status(400).send(await negResponse(serviceName, req.user.message))

      const logoutResult = await adminLogout(req.user.token)
      if (!logoutResult) return res.status(400).send(await negResponse(serviceName, `Admin with token ${req.user.token} failed to logout. Result is: ${logoutResult}`))

      res.status(200).send(await posResponse(serviceName, `Admin ${req.user._id} was successfully logged out.`))
    } catch (err) {
      next(err)
    }
  })

router.route('/admin/:id')
  .get(adminBearer, async (req, res, next) => {
    const serviceName = 'getAdminById'
    try {
      // Passport error handling
      if (req.user instanceof Error) return res.status(400).send(await negResponse(serviceName, req.user.message))

      const { id } = req.params
      // Validation
      if (!id) return res.status(400).send(await missResponse(serviceName, 'id'))

      const validId = await idValidation(id)
      if (!validId) return res.status(400).send(await negResponse(serviceName, `Id ${id} is not valid`))

      const result = await getAdmins(id)

      res.status(200).send(result[0])
    } catch (err) {
      next(err)
    }
  })
  .patch(adminBearer, async (req, res, next) => {
    const serviceName = 'updateAdminById'
    try {
      // Passport error handling
      if (req.user instanceof Error) return res.status(400).send(await negResponse(serviceName, req.user.message))

      // If req.body doesn't filled
      if (!req.body) return res.status(400).send(await missResponse(serviceName, 'Please fill up request body'))

      const { id } = req.params

      // Validation
      if (!id) return res.status(400).send(await missResponse(serviceName, 'id'))

      const validId = await idValidation(id)
      if (!validId) return res.status(400).send(await negResponse(serviceName, `Id ${id} is not valid`))

      // Logic
      const result = await updateAdmin({ _id: id }, req.body)
      if (result instanceof Error) res.status(400).send(await negResponse(serviceName, result))

      res.status(200).send(await posResponse(serviceName, `Admin ${id} was successfully updated with: ${JSON.stringify(req.body)}`))
    } catch (err) {
      next(err)
    }
  })
  .delete(adminBearer, async (req, res, next) => {
    const serviceName = 'deleteAdminById'
    try {
      // Passport error handling
      if (req.user instanceof Error) return res.status(400).send(await negResponse(serviceName, req.user.message))

      const { id } = req.params

      // Validation
      if (!id) return res.status(400).send(await missResponse(serviceName, 'id'))

      const validId = await idValidation(id)
      if (!validId) return res.status(400).send(await negResponse(serviceName, `Id ${id} is not valid`))

      // Logic
      const result = await deleteAdminById(id)
      if (result instanceof Error) res.status(400).send(await negResponse(serviceName, result))

      res.status(200).send(await posResponse(serviceName, `Admin ${id} was successfully deleted.`))
    } catch (err) {
      next(err)
    }
  })

// Error handling
app.use((req, res, next) => {
  res.status(404).json({ error: 'Such route was not found' })
})

app.use(async (err, req, res, next) => {
  res.status(500).send(await negResponse('Server', err.message))
})

module.exports = app
