const mongoose = require("mongoose");

// Función que conecta con MongoDB Atlas usando la URL del .env
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Conectado con éxito a la BBDD");
  } catch (error) {
    console.log("Error conectando con la BBDD", error);
  }
};

module.exports = { connectDB };
