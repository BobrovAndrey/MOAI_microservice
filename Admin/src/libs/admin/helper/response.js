/**
 * returns assembled positive response (actual version)
 * @param {string} [service] service that send response
 * @param {string} [payload] response text
 */
const posResponse = (service, payload) => {
  return {
    error: false,
    service: `${service}`,
    response: `${payload}`
  }
}

/**
 * returns assembled 'field missing' response
 * @param {string} [serviceName] service that send response
 * @param {string} [fieldName] filed name that missing
 */
const missResponse = async (serviceName, fieldName) => {
  return {
    error: true,
    service: `${serviceName}`,
    response: `Required field are missing: ${fieldName}.`
  }
}

/**
 * returns assembled negative response
 * @param {string} [service] service that send response
 * @param {string} [payload] response text
 */
const negResponse = (service, payload) => {
  return {
    error: true,
    service: `${service}`,
    response: `${payload}`
  }
}

module.exports = {
  missResponse,
  negResponse,
  posResponse
}
