const db = require("../config/database.js");

exports.getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, name, email, avatar_url FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
};

exports.updateMe = async (req, res) => {
  const { name, avatar_url } = req.body;

  try {
    await db.query("UPDATE users SET name = ?, avatar_url = ? WHERE id = ?", [
      name,
      avatar_url,
      req.user.id,
    ]);

    res.json({ message: "Perfil actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
};
