const validate = (schema) => {
  return (req, res, next) => {
    const validationResults = Object.entries(schema).map(([key, joiSchema]) => {
      const { error } = joiSchema.validate(req[key], { abortEarly: false, allowUnknown: false });
      return error ? { key, details: error.details } : null;
    });

    const errors = validationResults.filter((result) => result !== null);

    if (errors.length > 0) {
      const errorMessages = errors.flatMap((err) => err.details.map((detail) => detail.message.replace(/"/g, '')));
      return res.status(400).json({
        success: false,
        message: errors[0].details[0].message.replace(/"/g, ""),
        errors: errorMessages,
      });
    }

    next();
  };
};

export default validate;