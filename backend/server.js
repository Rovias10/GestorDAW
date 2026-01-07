const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
require("dotenv").config();

const db = require("./config/database.js");

const projectRoutes = require("./routes/projectRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const statsRoutes = require("./routes/statsRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/stats", statsRoutes);

app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Usuario conectado al socket: " + socket.id);

  socket.on("join_project", (projectId) => {
    socket.join(`project_${projectId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      await db.query(
        "INSERT INTO project_messages (project_id, user_id, message) VALUES (?, ?, ?)",
        [data.projectId, data.userId, data.message]
      );
      const messageData = {
        ...data,
        created_at: new Date(),
      };
      io.to(`project_${data.projectId}`).emit("receive_message", messageData);
    } catch (error) {
      console.error("Error guardando mensaje:", error);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
