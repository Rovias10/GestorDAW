const db = require("../config/database.js");

exports.createTask = async (req, res) => {
  const projectId = req.params.id;
  const { title, status, assigned_to_user_id } = req.body;

  if (!title) {
    return res.status(400).json({ message: "El título es obligatorio" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO task (project_id, title, status, user_id) VALUES (?, ?, ?, ?)",
      [projectId, title, status || "pending", assigned_to_user_id || null]
    );

    res.status(201).json({
      message: "Tarea creada",
      id: result.insertId,
      project_id: projectId,
      title,
      status: status || "pending",
      user_id: assigned_to_user_id,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al crear la tarea", error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  const taskId = req.params.id;
  const { title, status, assigned_to_user_id } = req.body;

  try {
    await db.query(
      "UPDATE task SET title = ?, status = ?, user_id = ? WHERE id = ?",
      [title, status, assigned_to_user_id, taskId]
    );
    res.json({ message: "Tarea actualizada" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al actualizar la tarea", error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  const taskId = req.params.id;
  try {
    await db.query("DELETE FROM task WHERE id = ?", [taskId]);
    res.json({ message: "Tarea eliminada" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al eliminar la tarea", error: error.message });
  }
};
