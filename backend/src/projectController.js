const db = require("../config/database.js");

exports.getAllProjects = async (req, res) => {
  try {
    const userID = req.user.id;
    const query = `
      SELECT p.*, 'owner' as role 
      FROM projects p 
      WHERE p.owner_id = ?
      
      UNION
      
      SELECT p.*, pc.role 
      FROM projects p
      JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE pc.user_id = ?
      
      ORDER BY created_at DESC
    `;

    const [projects] = await db.query(query, [userID, userID]);
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los proyectos" });
  }
};

exports.createProject = async (req, res) => {
  const { name, description } = req.body;
  const owner_id = req.user.id;

  if (!name) {
    return res.status(400).json({ message: "Nombre es obligatorio" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)",
      [name, description, owner_id]
    );

    res.status(201).json({
      message: "Proyecto creado exitosamente",
      id: result.insertId,
      name,
      description,
      role: "owner",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el proyecto" });
  }
};

exports.getProjectDetail = async (req, res) => {
  const projectId = req.params.id;
  const currentUserId = req.user.id;

  try {
    const [projects] = await db.query("SELECT * FROM projects WHERE id = ?", [
      projectId,
    ]);

    if (projects.length === 0) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }
    const project = projects[0];

    let myRole = "viewer";

    if (project.owner_id === currentUserId) {
      myRole = "owner";
    } else {
      const [collabs] = await db.query(
        "SELECT role FROM project_collaborators WHERE project_id = ? AND user_id = ?",
        [projectId, currentUserId]
      );
      if (collabs.length > 0) {
        myRole = collabs[0].role;
      }
    }

    const [task] = await db.query(
      `SELECT t.*, u.name as assignee_name 
     FROM task t
     LEFT JOIN users u ON t.user_id = u.id
     WHERE t.project_id = ?`,
      [projectId]
    );

    const [collaborators] = await db.query(
      `SELECT u.id, u.name, u.email, pc.role 
       FROM project_collaborators pc
       JOIN users u ON pc.user_id = u.id
       WHERE pc.project_id = ?`,
      [projectId]
    );

    const [owner] = await db.query(
      `SELECT id, name, email FROM users WHERE id = ?`,
      [project.owner_id]
    );

    if (owner.length > 0) {
      collaborators.unshift({ ...owner[0], role: "owner" });
    }

    res.json({
      project,
      tasks: task,
      collaborators,
      currentUserRole: myRole,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al cargar detalles" });
  }
};

exports.addCollaborator = async (req, res) => {
  const projectId = req.params.id;
  const { email, role } = req.body;

  try {
    const [users] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no Encontrado" });
    }

    const userIdToAdd = users[0].id;
    await db.query(
      "INSERT INTO project_collaborators (project_id, user_id, role) VALUES (?, ?, ?)",
      [projectId, userIdToAdd, role || "collaborator"]
    );

    res.json({ message: "Invitación enviada" });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "El usuario ya está en el proyecto" });
    }
    res.status(500).json({ message: "Error al invitar" });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    await db.query("DELETE FROM projects WHERE id = ? AND owner_id = ?", [
      req.params.id,
      req.user.id,
    ]);
    res.json({ message: "Proyecto eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar" });
  }
};
