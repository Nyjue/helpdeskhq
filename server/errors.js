// One error type for "the request was wrong, tell the client". Services throw
// these; the error-handling middleware turns them into JSON responses.

class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.fields = fields; // optional { fieldName: 'what is wrong' }
  }
}

module.exports = { HttpError };
