const db = require("../config/database.js");

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const [projectCountResult] = await db.query(
      `
      SELECT COUNT(*) as total FROM (
          SELECT id FROM projects WHERE owner_id = ?
          UNION
          SELECT project_id FROM project_collaborators WHERE user_id = ?
      ) as user_projects
    `,
      [userId, userId]
    );

    const totalProjects = projectCountResult[0].total;

    const [taskStatsResult] = await db.query(
      `
      SELECT t.status, COUNT(*) as count
      FROM task t
      WHERE t.project_id IN (
          SELECT id FROM projects WHERE owner_id = ?
          UNION
          SELECT project_id FROM project_collaborators WHERE user_id = ?
      )
      GROUP BY t.status
    `,
      [userId, userId]
    );

    let pendingTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;

    taskStatsResult.forEach((row) => {
      if (row.status === "pending") pendingTasks = row.count;
      else if (row.status === "completed") completedTasks = row.count;
      else if (row.status === "in_progress") inProgressTasks = row.count;
    });

    res.json({
      totalProjects,
      tasksPending: pendingTasks,
      tasksCompleted: completedTasks,
      inProgressTasks,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
};
