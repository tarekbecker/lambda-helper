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

function extractTenant(e) {
      return e.requestContext.authorizer.claims.tenant;
}

module.exports = {
  sendResponse,
  handleError,
  extractTenant,
  logger
}

exports = module.exports
