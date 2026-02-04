
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  // console.error("ERROR:", err);

  // Only expose safe messages to client
  const publicMessage =
    statusCode >= 500
      ? "Something went wrong. Please try again later."
      : err.message || "Request failed.";

  res.status(statusCode).json({
    success: false,
    message: publicMessage,
  });
};

module.exports = errorHandler;
