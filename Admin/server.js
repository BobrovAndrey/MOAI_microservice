const mongoose = require('mongoose')
const mongoDB = require('./config/keys')[process.env.NODE_ENV || 'development']

mongoose.connect(mongoDB, { useNewUrlParser: true })
  .then(() => console.log(`MOAI Admin service DB connected!`))

const app = require('./src/app')

// app.use(router)
app.listen(9002, console.log('MOAI Admin listening on port 9002'))
