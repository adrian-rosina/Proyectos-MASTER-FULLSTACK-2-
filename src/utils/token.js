const jwt = require("jsonwebtoken");

// Crea un token con el id y el email del usuario que dura 1 día
const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Comprueba que el token es válido y devuelve los datos que lleva dentro
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
