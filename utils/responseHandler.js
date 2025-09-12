/**
 * Utility for standardized API responses
 */

/**
 * Send a success response
 * @param {Object} res - HTTP response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object} data - Response data
 */
function sendSuccess(res, statusCode, message, data = null) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  const response = {
    success: true,
    message,
    ...(data && { data })
  };
  res.end(JSON.stringify(response));
}

/**
 * Send an error response
 * @param {Object} res - HTTP response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Error} error - Error object (optional)
 */
function sendError(res, statusCode, message, error = null) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  const response = {
    success: false,
    message,
    ...(error && process.env.NODE_ENV !== 'production' && { error: error.message })
  };
  res.end(JSON.stringify(response));
}

module.exports = { sendSuccess, sendError };