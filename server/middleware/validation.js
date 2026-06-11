import { validationResult, body } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

export const questionValidationRules = [
  body("questionTitle")
    .trim()
    .notEmpty()
    .withMessage("Question must have a title"),
  body("questionBody")
    .trim()
    .notEmpty()
    .withMessage("Question must have a body"),
  body("questionTags")
    .notEmpty()
    .withMessage("Question must have tags"),
  validateRequest
];

export const answerValidationRules = [
  body("answerBody")
    .trim()
    .notEmpty()
    .withMessage("Answer body is required"),
  body("userAnswered")
    .trim()
    .notEmpty()
    .withMessage("User name is required"),
  validateRequest
];

export const userUpdateValidationRules = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty"),
  validateRequest
];

export const authValidationRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  validateRequest
];
