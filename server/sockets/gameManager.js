const Room = require("../models/Room");
const Game = require("../models/Game");
const User = require("../models/User");
const { addWordPower } = require("../utils/levelSystem");
const { computeFinalScores, bumpActivity } = require("./utils");

async function endGame(io, roomCode) {
  const room = await Room.findOne({ code: roomCode });
  if (!room) return;

  // Reset room state
  room.started = false;
  room.letter = null;
  room.roundEndTime = null;
  await room.save();
  await bumpActivity(roomCode);

  // Compute final scores
  const finalScores = computeFinalScores(room);

  // Save game history
  await Game.create({
    roomCode,
    players: room.players,
    rounds: room.rounds,
    categories: room.categories,
    roundsData: room.roundsData,
    winners: finalScores.winners,
  });

  // Award Word Power (WP) to all players
  for (const [playerId, totalPoints] of Object.entries(finalScores.totals)) {
    const user = await User.findById(playerId);
    if (!user) continue;

    // WP = half of total points
    const wpEarned = Math.floor(totalPoints / 2);
    if (wpEarned > 0) {
      addWordPower(user, wpEarned); // update wordPower + level
      await user.save();

      io.to(roomCode).emit("playerWPUpdated", {
        userId: playerId,
        wordPower: user.wordPower,
        level: user.level,
        wpEarned,
      });
    }
  }

  // Emit final results to all players
  io.to(roomCode).emit("gameEnded", {
    ...finalScores,
    serverNow: Date.now(),
  });

  // Send fresh room state
  const freshRoom = await Room.findOne({ code: roomCode }).populate(
    "players host"
  );
  io.to(roomCode).emit("roomUpdated", { room: freshRoom });
  io.to(roomCode).emit("redirectToLobby", { code: roomCode });
}

module.exports = { endGame };
