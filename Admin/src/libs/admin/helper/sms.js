const sgMail = require('@sendgrid/mail')

// Configuration
sgMail.setApiKey(`123456`)

const dateNow = () => {
  const date = new Date()
  return date
}

/**
 * Will send Email to recipient and return true if success or false if its fails
 * @param {String} [msgTo] recipients email
 * @param {String} [msgSubject] message subject
 * @param {String} [msgHtml] message body with html tags (<h2>**your message**</h2>)
 * @param {String} [serviceName] service, which send message
 */
const sendGridMessage = async function (msgTo, msgSubject, msgHtml, serviceName) {
  try {
    const msg = {
      to: msgTo,
      from: 'testmail@gmail.com',
      subject: msgSubject,
      text: 'Message',
      html: msgHtml
    }

    await sgMail.send(msg)
    console.log(`<sendGridMessage service>: Mail was send form '${serviceName}' to ${msgTo}.`, `Date is: ${dateNow()}`)
    return true
  } catch (err) {
    console.log(`<sendGridMessage service>: Error during 'sendGridMessage'. Error is: ${err}`, 'Date is: ', dateNow())
    return false
  }
}

module.exports = sendGridMessage
