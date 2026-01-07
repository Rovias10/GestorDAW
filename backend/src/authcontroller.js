const crypto = require("crypto");
const db = require("../config/database.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("./config/mailer");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciales Inválidas" });
    }

    const user = users[0];
    if (user.is_verified === 0) {
      return res.status(401).json({
        message: "Tu cuenta no está activa. Revisa tu correo para verificarla.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Credenciales Inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || "secreto_super_seguro",
      { expiresIn: "12h" }
    );

    res.json({
      message: "Inicio de sesión exitoso",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await db.query(
      "INSERT INTO users (name, email, password, verification_token, is_verified) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, verificationToken, 0]
    );

    const verifyLink = `http://34.175.158.17:3000/frontend-sin-simular/pages/auth/verify.html?token=${verificationToken}`;

    try {
      console.log(`Enviando correo de verificación a ${email}...`);
      await sendEmail(
        email,
        "Verifica tu cuenta - GestorDAW",
        `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                <h2>¡Hola ${name}!</h2>
                <p>Gracias por registrarte. Para activar tu cuenta, haz clic en el botón:</p>
                <a href="${verifyLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verificar Cuenta</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">O copia este enlace: ${verifyLink}</p>
            </div>
            `
      );
    } catch (mailError) {
      console.error("Error enviando email:", mailError);
    }

    res.status(201).json({
      message: "Usuario registrado. Revisa tu correo para activar la cuenta.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Falta el código de verificación" });
  }

  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE verification_token = ?",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Código inválido o expirado" });
    }

    const user = users[0];

    await db.query(
      "UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?",
      [user.id]
    );

    res.json({ message: "¡Cuenta verificada! Ya puedes iniciar sesión." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al verificar la cuenta" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: "No existe un usuario con ese email" });
    }

    const user = users[0];
    const token = crypto.randomBytes(20).toString("hex");
    const expireDate = new Date(Date.now() + 3600000);

    await db.query(
      "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?",
      [token, expireDate, user.id]
    );
    const resetUrl = `http://34.175.158.17:3000/frontend-sin-simular/pages/auth/reset-password.html?token=${token}`;
    await sendEmail(
      email,
      "Recuperación de Contraseña - GestorDAW",
      `
      <div style="font-family: Arial, sans-serif;">
        <h2>Recuperar Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva (válido por 1 hora):</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
        <p style="margin-top:20px; color: #666;">Si no fuiste tú, ignora este correo.</p>
      </div>
      `
    );

    res.json({ message: "Correo de recuperación enviado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    const user = users[0];

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await db.query(
      "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    res.json({
      message:
        "Contraseña actualizada correctamente. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al restablecer contraseña" });
  }
};
exports.getProfile = async (req, res) => {
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
