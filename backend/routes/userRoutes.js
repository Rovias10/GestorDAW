const express = require("express");
const router = express.Router();
const userController = require("../src/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/me", authMiddleware, userController.getMe);
router.put("/me", authMiddleware, userController.updateMe);

module.exports = router;
