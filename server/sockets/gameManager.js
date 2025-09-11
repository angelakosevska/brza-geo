const Room = require("../models/Room");
const Game = require("../models/Game");
const User = require("../models/User");
const { addWordPower } = require("../utils/levelSystem");
const { computeFinalScores, bumpActivity } = require("./utils");

async function endGame(io, roomCode) {
  const room = await Room.findOne({ code: roomCode });
  if (!room) return;

  room.started = false;
  room.letter = null;
  room.roundEndTime = null;
  await room.save();
  await bumpActivity(roomCode);

  const finalScores = computeFinalScores(room);

  await Game.create({
    roomCode,
    players: room.players,
    rounds: room.rounds,
    categories: room.categories,
    roundsData: room.roundsData,
    winners: finalScores.winners,
  });

  for (const [playerId, totalPoints] of Object.entries(finalScores.totals)) {
    const user = await User.findById(playerId);
    if (!user) continue;

    addWordPower(user, totalPoints);
    await user.save();

    io.to(roomCode).emit("playerWPUpdated", {
      userId: playerId,
      wordPower: user.wordPower,
      level: user.level,
    });
  }

  io.to(roomCode).emit("gameEnded", {
    ...finalScores,
    serverNow: Date.now(),
  });

  const freshRoom = await Room.findOne({ code: roomCode }).populate(
    "players host"
  );
  io.to(roomCode).emit("roomUpdated", { room: freshRoom });
  io.to(roomCode).emit("redirectToLobby", { code: roomCode });
}

module.exports = { endGame };
