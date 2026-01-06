const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
   
    const firstError = errors.array()[0].msg;
    
    return res.status(400).json({ 
      errors: errors.array(),
      message: firstError
    });
  }
  next();
};

exports.validateRegister = [
  body("name")
    .exists().withMessage("El nombre es obligatorio")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ min: 3 }).withMessage("El nombre debe tener al menos 3 caracteres"),

  body("email")
    .exists().withMessage("El email es obligatorio")
    .isEmail().withMessage("Debes proporcionar un email válido"),

  body("password")
    .exists().withMessage("La contraseña es obligatoria")
    .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres")
    .matches(/\d/).withMessage("La contraseña debe contener al menos un número")
    .matches(/[A-Z]/).withMessage("La contraseña debe contener al menos una mayúscula"),

  handleValidationErrors
];

exports.validateLogin = [
  body("email").isEmail().withMessage("Email inválido"),
  body("password").exists().withMessage("La contraseña es requerida"),

  handleValidationErrors
];