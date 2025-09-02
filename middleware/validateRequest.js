exports.validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    const err = new Error(error.details[0].message);
    err.status = 400;
    return next(err);
  }
  next();
};