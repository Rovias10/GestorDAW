const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

const projectRoutes = require("./routes/projectRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const taskRoutes = require("./routes/taskRoutes");
const statsRoutes = require("./routes/statsRoutes");

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);

app.use("/api/tasks", taskRoutes);
app.use("/api/stats", statsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
