const Game = require("../models/game.model");

// Traer todos los juegos
const getGames = async (req, res) => {
  try {
    const games = await Game.find();
    return res.status(200).json(games);
  } catch (error) {
    return res.status(500).json("Error al obtener los juegos");
  }
};

// Traer un juego por su id
const getGameById = async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.findById(id);

    // Si no lo encuentra, findById devuelve null
    if (!game) {
      return res.status(404).json("Juego no encontrado");
    }

    return res.status(200).json(game);
  } catch (error) {
    return res.status(400).json("Error al obtener el juego");
  }
};

// Crear un juego nuevo
const postGame = async (req, res) => {
  try {
    const newGame = new Game(req.body);
    const gameSaved = await newGame.save();
    return res.status(201).json(gameSaved);
  } catch (error) {
    return res.status(400).json("Error al crear el juego");
  }
};

// Actualizar un juego
const putGame = async (req, res) => {
  try {
    const { id } = req.params;

    // new: true devuelve el juego ya actualizado y runValidators aplica las reglas del modelo
    const gameUpdated = await Game.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!gameUpdated) {
      return res.status(404).json("Juego no encontrado");
    }

    return res.status(200).json(gameUpdated);
  } catch (error) {
    return res.status(400).json("Error al actualizar el juego");
  }
};

// Borrar un juego
const deleteGame = async (req, res) => {
  try {
    const { id } = req.params;
    const gameDeleted = await Game.findByIdAndDelete(id);

    if (!gameDeleted) {
      return res.status(404).json("Juego no encontrado");
    }

    return res.status(200).json({ message: "Juego eliminado", gameDeleted });
  } catch (error) {
    return res.status(400).json("Error al eliminar el juego");
  }
};

module.exports = { getGames, getGameById, postGame, putGame, deleteGame };
