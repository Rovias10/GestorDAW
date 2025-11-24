const express = require("express");
const cors = require("cors");
const projectRoutes = require("./src/routes/projectRoutes.js");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/task", require("./routes/projects"));
app.use("/api/task", require("./routes/tasks"));
app.use('/api/projects', projectRoutes);

const PORT = process.env.PORT || 3306;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});


