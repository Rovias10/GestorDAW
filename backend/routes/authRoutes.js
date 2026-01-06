const express = require("express");
const router = express.Router();

const authController = require("../src/authcontroller");

const {
  validateRegister,
  validateLogin,
} = require("../src/validators/authValidator");

router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/verify", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
