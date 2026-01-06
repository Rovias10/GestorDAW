const db = require("../config/database.js");
const sendEmail = require("./config/mailer.js");

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

    if (req.user && req.user.email) {
      try {
        console.log("Enviando aviso de actualización a: " + req.user.email);

        await sendEmail(
          req.user.email,
          "Perfil Actualizado - GestorDAW",
          `
          <div style="font-family: Arial, sans-serif;">
            <h1>Hola ${name}</h1>
            <p>Te confirmamos que has actualizado tu perfil correctamente.</p>
            <p>Si no has sido tú, por favor contacta con soporte inmediatamente.</p>
          </div>
          `
        );
      } catch (mailError) {
        console.error(
          "El perfil se actualizó, pero el correo falló:",
          mailError.message
        );
      }
    } else {
      console.log("No se encontró el email en el token, correo no enviado.");
    }
    res.json({ message: "Perfil actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
};
