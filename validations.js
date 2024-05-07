const Joi = require("joi");

const validateSignupData = (data) => {
  const schema = Joi.object({
    fullname: Joi.string().min(5).max(25).trim(true).required(),
    email: Joi.string().email().trim(true).required(),
    password: Joi.string().min(8).trim(true).required(),
    role: Joi.string().valid("admin", "buyer").required(),
  });
  return schema.validate(data);
};

const validateLoginData = (data) =>{
  const schema = Joi.object({
    email: Joi.string().email().trim(true).required(),
    password: Joi.string().min(8).trim(true).required(),
  });
  return schema.validate(data);
}

module.exports = { validateSignupData, validateLoginData}
