const express = require("express");
const router = express.Router();
const projectController = require("../src/projectController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", projectController.getAllProjects);
router.post("/", projectController.createProject);

module.exports = router;
