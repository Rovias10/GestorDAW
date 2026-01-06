const express = require("express");
const router = express.Router();
const taskController = require("../src/taskController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.get("/my-tasks", taskController.getMyTasks);

router.post("/project/:id", taskController.createTask);
router.post("/project/:id", taskController.createTask);

router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

router.post("/:id/timer", taskController.toggleTimer);
module.exports = router;

module.exports = router;
