const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const Game = require("../models/game.model");
const { generateToken } = require("../utils/token");
const { deleteImgCloudinary } = require("../utils/cloudinary.util");

// Registro de usuario (la imagen ya la ha subido el middleware upload)
const registerUser = async (req, res) => {
  try {
    // Si no llega imagen, no seguimos
    if (!req.file) {
      return res.status(400).json("Debes enviar una imagen");
    }

    // Comprobamos si el email ya existe
    const userExists = await User.findOne({ email: req.body.email });

    if (userExists) {
      // Borramos la imagen que acabamos de subir porque no la vamos a usar
      await deleteImgCloudinary(req.file.filename);
      return res.status(400).json("Ese email ya está registrado");
    }

    // El rol siempre es "user", aunque en el body manden otro
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: "user",
      image: req.file.path,
      imageId: req.file.filename,
    });

    // Aquí se ejecuta el hook que encripta la contraseña
    const userSaved = await newUser.save();

    // No devolvemos la contraseña en la respuesta
    userSaved.password = undefined;

    return res.status(201).json(userSaved);
  } catch (error) {
    // Si falla el guardado, borramos la imagen que se había subido
    if (req.file?.filename) await deleteImgCloudinary(req.file.filename);
    return res.status(400).json("Error al registrar el usuario");
  }
};

// Login: devuelve el token y el usuario
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // Mensaje genérico para no dar pistas de si falla el email o la contraseña
    if (!user) {
      return res.status(400).json("Usuario o contraseña incorrectos");
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json("Usuario o contraseña incorrectos");
    }

    const token = generateToken(user._id, user.email);

    user.password = undefined;

    return res.status(200).json({ token, user });
  } catch (error) {
    return res.status(400).json("Error en el login");
  }
};

// Traer todos los usuarios (solo admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").populate("favoriteGames");
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json("Error al obtener los usuarios");
  }
};

// Traer un usuario por su id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password").populate("favoriteGames");

    if (!user) {
      return res.status(404).json("Usuario no encontrado");
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json("Error al obtener el usuario");
  }
};

// Actualizar un usuario (el propio usuario o un admin)
const putUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Solo el propio usuario o un admin pueden continuar
    if (req.user.role !== "admin" && req.user._id.toString() !== id) {
      if (req.file?.filename) await deleteImgCloudinary(req.file.filename);
      return res.status(403).json("No tienes permisos para hacer esto");
    }

    const oldUser = await User.findById(id);

    if (!oldUser) {
      if (req.file?.filename) await deleteImgCloudinary(req.file.filename);
      return res.status(404).json("Usuario no encontrado");
    }

    // El rol y los favoritos tienen sus propias rutas, aquí no se tocan.
    // Tampoco dejamos cambiar el imageId a mano.
    delete req.body.role;
    delete req.body.favoriteGames;
    delete req.body.imageId;

    // findByIdAndUpdate no ejecuta el hook pre("save"), así que encriptamos a mano
    if (req.body.password) {
      if (req.body.password.length < 8) {
        if (req.file?.filename) await deleteImgCloudinary(req.file.filename);
        return res.status(400).json("La contraseña debe tener al menos 8 caracteres");
      }
      req.body.password = bcrypt.hashSync(req.body.password, 10);
    }

    // Si llega imagen nueva, guardamos su url y su id
    if (req.file) {
      req.body.image = req.file.path;
      req.body.imageId = req.file.filename;
    }

    const userUpdated = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    // Una vez actualizado, borramos la imagen antigua de Cloudinary
    if (req.file) {
      await deleteImgCloudinary(oldUser.imageId);
    }

    return res.status(200).json(userUpdated);
  } catch (error) {
    if (req.file?.filename) await deleteImgCloudinary(req.file.filename);
    return res.status(400).json("Error al actualizar el usuario");
  }
};

// Cambiar el rol de un usuario (solo admin)
const putUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role !== "user" && role !== "admin") {
      return res.status(400).json("El rol debe ser 'user' o 'admin'");
    }

    const userUpdated = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!userUpdated) {
      return res.status(404).json("Usuario no encontrado");
    }

    return res.status(200).json(userUpdated);
  } catch (error) {
    return res.status(400).json("Error al cambiar el rol");
  }
};

// Añadir juegos favoritos sin duplicar y sin borrar los que ya había
const addFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const { favoriteGames } = req.body;

    if (req.user.role !== "admin" && req.user._id.toString() !== id) {
      return res.status(403).json("No tienes permisos para hacer esto");
    }

    if (!Array.isArray(favoriteGames) || favoriteGames.length === 0) {
      return res.status(400).json("Debes enviar un array favoriteGames con ids");
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json("Usuario no encontrado");
    }

    // Pasamos los favoritos que ya tiene a string para poder compararlos
    const currentIds = [];
    for (const gameId of user.favoriteGames) {
      currentIds.push(gameId.toString());
    }

    // Recorremos los ids nuevos: comprobamos que el juego existe y que no esté ya
    for (const gameId of favoriteGames) {
      const game = await Game.findById(gameId);

      if (!game) {
        return res.status(404).json(`El juego ${gameId} no existe`);
      }

      if (!currentIds.includes(gameId.toString())) {
        currentIds.push(gameId.toString());
      }
    }

    const userUpdated = await User.findByIdAndUpdate(
      id,
      { favoriteGames: currentIds },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("favoriteGames");

    return res.status(200).json(userUpdated);
  } catch (error) {
    return res.status(400).json("Error al añadir los favoritos");
  }
};

// Quitar un juego de los favoritos
const removeFavorite = async (req, res) => {
  try {
    const { id, gameId } = req.params;

    if (req.user.role !== "admin" && req.user._id.toString() !== id) {
      return res.status(403).json("No tienes permisos para hacer esto");
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json("Usuario no encontrado");
    }

    // Nos quedamos con todos los favoritos menos el que queremos quitar
    const newFavorites = user.favoriteGames.filter(
      (favoriteId) => favoriteId.toString() !== gameId
    );

    // Si la longitud es la misma, ese juego no estaba en favoritos
    if (newFavorites.length === user.favoriteGames.length) {
      return res.status(404).json("Ese juego no está en los favoritos");
    }

    const userUpdated = await User.findByIdAndUpdate(
      id,
      { favoriteGames: newFavorites },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("favoriteGames");

    return res.status(200).json(userUpdated);
  } catch (error) {
    return res.status(400).json("Error al quitar el favorito");
  }
};

// Borrar un usuario (el propio usuario o un admin) y su imagen de Cloudinary
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "admin" && req.user._id.toString() !== id) {
      return res.status(403).json("No tienes permisos para hacer esto");
    }

    const userDeleted = await User.findByIdAndDelete(id);

    if (!userDeleted) {
      return res.status(404).json("Usuario no encontrado");
    }

    // Borramos también la imagen del usuario en Cloudinary
    await deleteImgCloudinary(userDeleted.imageId);

    userDeleted.password = undefined;

    return res.status(200).json({ message: "Usuario eliminado", userDeleted });
  } catch (error) {
    return res.status(400).json("Error al eliminar el usuario");
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  putUser,
  putUserRole,
  addFavorites,
  removeFavorite,
  deleteUser,
};
