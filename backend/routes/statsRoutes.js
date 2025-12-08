const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const statsController = require("../src/statController");

router.use(authMiddleware);
router.get("/dashboard", statsController.getDashboardStats);
module.exports = router;
