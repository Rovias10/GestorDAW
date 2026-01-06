const express = require("express");
const router = express.Router();
const statsController = require("../src/statsController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/dashboard", authMiddleware, statsController.getDashboardStats);

module.exports = router;
