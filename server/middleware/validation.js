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
    .withMessage("Question must have a title")
    .isLength({ max: 300 })
    .withMessage("Title cannot exceed 300 characters"),
  body("questionBody")
    .trim()
    .notEmpty()
    .withMessage("Question must have a body")
    .isLength({ max: 30000 })
    .withMessage("Body cannot exceed 30000 characters"),
  body("questionTags")
    .notEmpty()
    .withMessage("Question must have tags")
    .custom((value) => {
      const tags = Array.isArray(value) ? value : [value];
      if (tags.length > 5) {
        throw new Error("You can specify at most 5 tags");
      }
      for (const tag of tags) {
        if (typeof tag !== "string" || tag.trim().length === 0) {
          throw new Error("Tags must be non-empty strings");
        }
        if (tag.length > 50) {
          throw new Error("Each tag cannot exceed 50 characters");
        }
      }
      return true;
    }),
  validateRequest
];

export const answerValidationRules = [
  body("answerBody")
    .trim()
    .notEmpty()
    .withMessage("Answer body is required")
    .isLength({ max: 30000 })
    .withMessage("Answer body cannot exceed 30000 characters"),
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

// Signup requires full password strength enforcement
export const signupValidationRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  validateRequest,
];

// Login only validates format — strength rules must NOT block users
// who registered before stricter rules were introduced.
export const loginValidationRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address"),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  validateRequest,
];

// Keep old export name as an alias for signup to avoid breaking any direct imports
export const authValidationRules = signupValidationRules;

// Reset-password requires the same strength as signup — a user must not be able
// to reset to a weak password that signup would have rejected.
export const resetPasswordValidationRules = [
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  validateRequest,
];
