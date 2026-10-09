const {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  putUser,
  putUserRole,
  addFavorites,
  removeFavorite,
  deleteUser,
} = require("../controllers/users.controllers");
const { isAuth } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/file");

const usersRouter = require("express").Router();

// Primero las rutas fijas y después las que llevan /:id
usersRouter.post("/register", upload.single("image"), registerUser);
usersRouter.post("/login", loginUser);
usersRouter.get("/", isAuth(["admin"]), getUsers);

// Rutas con /:id más largas antes que las de solo /:id
usersRouter.put("/:id/role", isAuth(["admin"]), putUserRole);
usersRouter.put("/:id/favorites", isAuth(), addFavorites);
usersRouter.delete("/:id/favorites/:gameId", isAuth(), removeFavorite);

usersRouter.get("/:id", isAuth(), getUserById);
usersRouter.put("/:id", isAuth(), upload.single("image"), putUser);
usersRouter.delete("/:id", isAuth(), deleteUser);

module.exports = usersRouter;
