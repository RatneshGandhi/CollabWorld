export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // In development, return full stack trace for easy debugging
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // In production, do not leak internal system details
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }

  // Generic fallback for unhandled programming bugs
  console.error('[Unhandled Error]', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Something went wrong on the server',
  });
};