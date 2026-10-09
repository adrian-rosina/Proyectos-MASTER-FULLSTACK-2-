const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Esquema de los usuarios
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: [8, "La contraseña debe tener al menos 8 caracteres"],
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    image: { type: String },
    // public_id de Cloudinary, lo guardamos para poder borrar la imagen
    imageId: { type: String },
    // Array con ids de juegos de la colección games
    favoriteGames: [{ type: mongoose.Types.ObjectId, ref: "Game" }],
  },
  {
    timestamps: true,
  }
);

// Antes de guardar, encriptamos la contraseña.
// OJO: este hook se ejecuta en cada save(), por eso solo usamos save() en el registro.
// En las actualizaciones usamos findByIdAndUpdate (no ejecuta el hook).
userSchema.pre("save", function (next) {
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
