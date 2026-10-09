require("dotenv").config();
const express = require("express");
const { connectDB } = require("./src/config/db");
const gamesRouter = require("./src/routes/games.routes");
const usersRouter = require("./src/routes/users.routes");

const app = express();

// Conectamos con la base de datos
connectDB();

// Para poder leer el body en formato JSON
app.use(express.json());

// Rutas
app.use("/api/games", gamesRouter);
app.use("/api/users", usersRouter);

// Middleware 404 para cualquier ruta que no exista (en Express 5 va sin "*")
app.use((req, res) => {
  return res.status(404).json("Ruta no encontrada");
});

app.listen(3000, () => {
  console.log("Servidor levantado en: http://localhost:3000");
});
