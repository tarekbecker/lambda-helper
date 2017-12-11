const Promise = require('bluebird')
const AWS = require('aws-sdk')

AWS.config.setPromisesDependency(Promise)
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

const logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
}

function sendResponse (cb, body, statusCode = 200, headers = {}) {
  exports.logger.info(`Sending response, code: ${statusCode}`)
  exports.logger.info(body)
  exports.logger.info(JSON.stringify(body))
  if (typeof (body) === 'string') {
    return cb(null, { body, statusCode, headers })
  }
  return cb(null, { body: JSON.stringify(body), statusCode, headers })
}

function handleError (cb) {
  return (err) => {
    exports.logger.error(err)
    if (cb) {
      exports.sendResponse(cb, { message: err.toString() }, 400)
    }
  }
}

function extractTenant (e) {
  return e.requestContext.authorizer.claims.tenant
}

function tenantFactory () {
  const { env: { s3bucket } } = process
  // time tenant data was loaded
  let tenantLoadTime = 0
  // promise containt tenant data
  let tenantPromise

  // this function returns tenant data promise
  // refreshes the data if older than a minute
  return function tenantInfo () {
    if (new Date().getTime() - tenantLoadTime > 1000 * 60) {
      exports.logger.info('Tenant info outdated, reloading')
      tenantPromise = s3.getObject({
        Bucket: s3bucket,
        Key: 'tenants.json'
      }).promise().then((data) => {
        const config = JSON.parse(data.Body.toString())
        exports.logger.info('Tenant config: %j', config)

        const tenantMap = {}
        config.forEach((t) => { tenantMap[t.id] = t })

        return tenantMap
      })
      tenantLoadTime = new Date().getTime()
    }
    return tenantPromise
  }
}

module.exports = {
  sendResponse,
  handleError,
  extractTenant,
  logger,
  tenantInfo: tenantFactory()
}

exports = module.exports
