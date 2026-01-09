const express = require("express");
const router = express.Router();
const projectController = require("../src/projectController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.get("/", projectController.getAllProjects);
router.post("/", projectController.createProject);
router.get("/:id", projectController.getProjectDetail);
router.delete("/:id", projectController.deleteProject);
router.post("/:id/invite", projectController.addCollaborator);
router.put("/:id/collaborators/:userId", projectController.updateCollaboratorRole);
router.delete("/:id/collaborators/:userId", projectController.removeCollaborator);

const taskController = require("../src/taskController");
router.post("/:id/tasks", taskController.createTask);
router.get("/:id/messages", projectController.getChatMessages);

router.get("/:id/activity", taskController.getProjectActivity);
module.exports = router;

