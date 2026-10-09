const mongoose = require("mongoose");

// Esquema de los videojuegos
const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    genre: {
      type: String,
      required: true,
      enum: ["Acción", "Aventura", "RPG", "Deportes", "Estrategia", "Shooter", "Plataformas"],
    },
    platform: {
      type: String,
      required: true,
      enum: ["PC", "PlayStation", "Xbox", "Nintendo", "Multiplataforma"],
    },
    year: { type: Number, min: 1970, max: 2100 },
    rating: { type: Number, min: 0, max: 10, default: 5 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// El nombre "Game" es el que usaremos en el ref del usuario. La colección se llamará "games"
const Game = mongoose.model("Game", gameSchema);

module.exports = Game;
