const { HttpError } = require('../errors');

// Wraps async route handlers so a thrown error reaches errorHandler below.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Last middleware in the chain. Turns every error into a consistent JSON body:
//   { "error": "message", "fields": { "email": "..." } }
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    const body = { error: err.message };
    if (err.fields) body.fields = err.fields;
    return res.status(err.status).json(body);
  }

  // express.json() throws this when the request body is not valid JSON.
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }

  console.error('Unexpected error:', err);
  return res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
}

module.exports = { asyncHandler, errorHandler };
