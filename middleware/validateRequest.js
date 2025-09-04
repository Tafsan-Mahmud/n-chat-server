exports.validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map(detail => {
      let message = detail.message;
      message = message.replace(/"/g, '');
      message = message.charAt(0).toUpperCase() + message.slice(1);
      return message;
    });
    const combinedMessage = errorMessages.join('. ');
    const err = new Error(combinedMessage);
    err.status = 400;
    return next(err);
  }
  next();
};

