require("dotenv").config();
const mongoose = require("mongoose");
const Game = require("../../models/game.model");
const games = require("../../data/games");

mongoose
  .connect(process.env.DB_URL)
  .then(async () => {
    // Buscamos los juegos que ya hay y, si hay alguno, borramos la colección
    const allGames = await Game.find();
    if (allGames.length) {
      await Game.collection.drop();
      console.log("Juegos anteriores eliminados");
    }
  })
  .catch((error) => console.log(`Error eliminando los juegos: ${error}`))
  .then(async () => {
    // Insertamos todos los juegos del array de una vez
    await Game.insertMany(games);
    console.log("Juegos insertados correctamente");
  })
  .catch((error) => console.log(`Error insertando los juegos: ${error}`))
  // Pase lo que pase, nos desconectamos al final
  .finally(() => mongoose.disconnect());
