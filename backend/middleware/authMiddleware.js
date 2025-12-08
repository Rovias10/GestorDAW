const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Acceso denegado. No se proporcionó token" });
  }

  try {
    const token = authHeader.replace("Bearer", "").trim();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Acceso denegado. Token inválido" });
  }
};
