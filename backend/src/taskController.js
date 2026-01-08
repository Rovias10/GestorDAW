const db = require("../config/database.js");

async function logActivity(projectId, userId, action, details) {
  try {
    if (!projectId || !userId) return;
    await db.query(
      "INSERT INTO project_activity (project_id, user_id, action_type, details) VALUES (?, ?, ?, ?)",
      [projectId, userId, action, details]
    );
  } catch (err) {
    console.error("Error guardando log:", err);
  }
}
exports.createTask = async (req, res) => {
  const projectId = req.params.id;
  const currentUserId = req.user.id;
  const {
    title,
    description,
    priority,
    status,
    due_date,
    assigned_to_user_id,
  } = req.body;

  if (!title)
    return res.status(400).json({ message: "El título es obligatorio" });

  try {
    const [result] = await db.query(
      `INSERT INTO task (project_id, title, description, priority, status, due_date, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        title,
        description || null,
        priority || "medium",
        status || "pending",
        due_date || null,
        assigned_to_user_id || null,
      ]
    );

    await logActivity(
      projectId,
      currentUserId,
      "CREATE_TASK",
      `Creó la tarea: ${title}`
    );

    res.status(201).json({ message: "Tarea creada", id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear tarea" });
  }
};
exports.updateTask = async (req, res) => {
  const taskId = req.params.id;
  const currentUserId = req.user.id;
  const {
    title,
    description,
    priority,
    status,
    due_date,
    assigned_to_user_id,
  } = req.body;

  try {
    const [tasks] = await db.query(
      "SELECT project_id, title FROM task WHERE id = ?",
      [taskId]
    );
    if (tasks.length === 0)
      return res.status(404).json({ message: "Tarea no encontrada" });

    await db.query(
      `UPDATE task SET title=?, description=?, priority=?, status=?, due_date=?, user_id=? WHERE id=?`,
      [
        title,
        description,
        priority,
        status,
        due_date,
        assigned_to_user_id,
        taskId,
      ]
    );

    await logActivity(
      tasks[0].project_id,
      currentUserId,
      "UPDATE_TASK",
      `Editó la tarea: ${title}`
    );

    res.json({ message: "Tarea actualizada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error actualizando tarea" });
  }
};

exports.deleteTask = async (req, res) => {
  const taskId = req.params.id;
  const currentUserId = req.user.id;

  try {
    const [tasks] = await db.query(
      "SELECT project_id, title FROM task WHERE id = ?",
      [taskId]
    );
    if (tasks.length > 0) {
      await db.query("DELETE FROM task WHERE id = ?", [taskId]);

      await logActivity(
        tasks[0].project_id,
        currentUserId,
        "DELETE_TASK",
        `Borró la tarea: ${tasks[0].title}`
      );
    }
    res.json({ message: "Tarea eliminada" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando tarea" });
  }
};

exports.toggleTimer = async (req, res) => {
  const taskId = req.params.id;
  const currentUserId = req.user.id;

  try {
    const [tasks] = await db.query("SELECT * FROM task WHERE id = ?", [taskId]);
    if (tasks.length === 0)
      return res.status(404).json({ message: "Tarea no encontrada" });

    const task = tasks[0];
    let newIsTracking = 0;
    let newTotal = task.total_seconds;
    let newLastStart = null;

    if (task.is_tracking) {
      const now = new Date();
      const start = new Date(task.last_start_time);
      const diffSeconds = Math.floor((now - start) / 1000);
      newTotal += diffSeconds;

      await logActivity(
        task.project_id,
        currentUserId,
        "STOP_TIMER",
        `Pausó: ${task.title} (+${diffSeconds}s)`
      );
    } else {
      newIsTracking = 1;
      newLastStart = new Date();
      await logActivity(
        task.project_id,
        currentUserId,
        "START_TIMER",
        `Inició cronómetro: ${task.title}`
      );
    }

    await db.query(
      "UPDATE task SET is_tracking=?, total_seconds=?, last_start_time=? WHERE id=?",
      [newIsTracking, newTotal, newLastStart, taskId]
    );

    res.json({
      message: "Tiempo actualizado",
      is_tracking: newIsTracking,
      total_seconds: newTotal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error timer" });
  }
};

exports.getProjectActivity = async (req, res) => {
  const projectId = req.params.id;
  try {
    const [rows] = await db.query(
      `
            SELECT pa.*, u.name as user_name, u.avatar_url 
            FROM project_activity pa
            JOIN users u ON pa.user_id = u.id
            WHERE pa.project_id = ?
            ORDER BY pa.created_at DESC LIMIT 50
        `,
      [projectId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error cargando actividad" });
  }
};
exports.getMyTasks = async (req, res) => {
  const userId = req.user.id;
  try {
    let isAdmin = false;
    try {
      // Intentar verificar rol global (si existe la columna)
      const [userRows] = await db.query("SELECT role FROM users WHERE id = ?", [
        userId,
      ]);
      if (userRows.length > 0 && userRows[0].role === "admin") {
        isAdmin = true;
      }
    } catch (e) {
      // Si falla (ej. no existe columna role), asumimos no admin
    }

    // Use subqueries to guarantee we get the user data if the ID exists
    let query = `
       SELECT 
          t.id, t.title, t.description, t.priority, t.status, t.due_date, t.created_at, t.user_id, t.project_id,
          p.name as project_name, 
          (SELECT COALESCE(name, 'Usuario Desconocido') FROM users WHERE id = t.user_id) as assignee_name,
          (SELECT COALESCE(email, 'sin-email') FROM users WHERE id = t.user_id) as assignee_email
       FROM task t
       JOIN projects p ON t.project_id = p.id
    `;

    const params = [];

    if (!isAdmin) {
      // Si no es admin global, filtramos por acceso al proyecto
      query += ` LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ? `;
      params.push(userId);

      query += ` WHERE t.user_id = ? OR p.owner_id = ? OR pc.user_id IS NOT NULL `;
      params.push(userId, userId);
    }

    query += ` ORDER BY t.due_date ASC`;

    const [tasks] = await db.query(query, params);
    
    // Debug output to server console
    console.log(`[DEBUG] getMyTasks: Found ${tasks.length} tasks.`);
    if (tasks.length > 0) {
        const withUser = tasks.filter(t => t.user_id);
        console.log(`[DEBUG] Tasks with active user_id: ${withUser.length}`);
        if(withUser.length > 0) {
            console.log(`[DEBUG] Sample task: TaskID ${withUser[0].id} UserID ${withUser[0].user_id} -> Name: ${withUser[0].assignee_name}`);
        }
    }
    
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener mis tareas" });
  }
};
