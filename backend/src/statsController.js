const db = require("../config/database");

exports.getDashboardStats = async (req, res) => {
  console.log("--- INICIO DEPURACIÓN DASHBOARD ---");
  try {
    const userId = req.user.id;
    console.log("1. Usuario solicitante ID:", userId);

    const [projectCountResult] = await db.query(
      `SELECT COUNT(*) as total FROM (
          SELECT id FROM projects WHERE owner_id = ? 
          UNION
          SELECT project_id FROM project_collaborators WHERE user_id = ?
      ) as user_projects`,
      [userId, userId]
    );

    console.log("2. Resultado Proyectos:", projectCountResult[0]);
    const totalProjects = projectCountResult[0].total;

    const [taskStatsResult] = await db.query(
      `SELECT t.status, COUNT(*) as count
      FROM task t
      WHERE t.project_id IN (
          SELECT id FROM projects WHERE owner_id = ?
          UNION
          SELECT project_id FROM project_collaborators WHERE user_id = ?
      )
      GROUP BY t.status`,
      [userId, userId]
    );

    console.log("3. Tareas encontradas:", taskStatsResult);

    let pendingTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;

    taskStatsResult.forEach((row) => {
      if (row.status === "pending" || row.status === "Pendiente")
        pendingTasks = row.count;
      else if (row.status === "completed" || row.status === "Completada")
        completedTasks = row.count;
      else if (row.status === "in_progress" || row.status === "En Progreso")
        inProgressTasks = row.count;
    });

    console.log("4. Enviando:", { totalProjects, tasksPending: pendingTasks });

    res.json({
      totalProjects,
      tasksPending: pendingTasks,
      tasksCompleted: completedTasks,
      inProgressTasks,
    });
  } catch (error) {
    console.error("ERROR CRÍTICO EN DASHBOARD:", error);
    res.status(500).json({ message: "Error estadística: " + error.message });
  }
};
