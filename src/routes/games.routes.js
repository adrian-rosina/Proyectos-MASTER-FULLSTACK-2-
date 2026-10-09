const {
  getGames,
  getGameById,
  postGame,
  putGame,
  deleteGame,
} = require("../controllers/games.controllers");
const { isAuth } = require("../middlewares/auth.middleware");

const gamesRouter = require("express").Router();

// Primero las rutas fijas y después las que llevan /:id
// Leer es público; crear, editar y borrar solo admin
gamesRouter.get("/", getGames);
gamesRouter.post("/", isAuth(["admin"]), postGame);
gamesRouter.get("/:id", getGameById);
gamesRouter.put("/:id", isAuth(["admin"]), putGame);
gamesRouter.delete("/:id", isAuth(["admin"]), deleteGame);

module.exports = gamesRouter;
