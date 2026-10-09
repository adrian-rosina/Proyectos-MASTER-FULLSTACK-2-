const User = require("../models/user.model");
const { verifyToken } = require("../utils/token");

// isAuth() -> cualquier usuario logueado
// isAuth(["admin"]) -> solo los usuarios con rol admin
const isAuth = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // Sacamos el token de la cabecera "Authorization: Bearer <token>"
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json("No estás autenticado");
      }

      // Si el token no es válido, verifyToken lanza error y pasamos al catch
      const decoded = verifyToken(token);

      // Buscamos al usuario del token y lo guardamos en la request
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json("No estás autenticado");
      }

      req.user = user;

      // Si se han pasado roles, comprobamos que el usuario tenga uno de ellos
      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return res.status(403).json("No tienes permisos para hacer esto");
      }

      next();
    } catch (error) {
      return res.status(401).json("Token no válido");
    }
  };
};

module.exports = { isAuth };
