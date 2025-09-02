const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Server Error';
  res.status(statusCode).json({ message });
};

module.exports = errorHandler;