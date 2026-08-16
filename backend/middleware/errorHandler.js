export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, _next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Server Error';

  // A malformed :id param (e.g. "/orders/not-an-id") makes Mongoose throw a
  // CastError, not return null — every findById()-based route was one bad
  // URL away from a raw 500 that leaks the model/field name from Mongoose's
  // internal message. Treat it as the 404 it actually is.
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose schema validation failures — reachable on routes that skip
  // express-validator and rely on the schema itself (e.g. admin product
  // create/update). Surface the field-level messages instead of the raw
  // Mongoose ValidationError object.
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // An invalid/malformed/expired JWT (e.g. stale localStorage token from a
  // JWT_SECRET rotation, or a hand-edited Authorization header) throws
  // instead of returning null — same class of bug as the CastError above,
  // just from jsonwebtoken instead of Mongoose. Was surfacing as a raw 500.
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized, invalid or expired token';
  }

  // Unique-index violation not already handled by the caller (e.g. a rare
  // concurrent duplicate registration/review race).
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
