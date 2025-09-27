const ReviewWord = require("../models/ReviewWord");
const Room = require("../models/Room");

function registerReviewHandlers(io, socket) {
  // ---- MARK WORD FOR REVIEW ----
  socket.on("markWordForReview", async ({ categoryId, word }) => {
    try {
      const userId = socket.data.user?.id;
      const roomCode = socket.data.roomCode;
      if (!userId || !roomCode || !word) return;

      const room = await Room.findOne({ code: roomCode });
      if (!room) return;

      const roundNumber = room.currentRound;
      const letter = room.letter;

      const review = new ReviewWord({
        gameId: room._id,
        roomCode,
        roundNumber,
        letter,
        category: categoryId,
        word,
        submittedBy: userId,
      });

      await review.save();
      const list = await ReviewWord.find({ roomCode, roundNumber }).lean();
      io.to(roomCode).emit("reviewWordsUpdated", list);
      socket.emit("wordMarkedForReview", { categoryId, word });
    } catch (err) {
      console.error("❌ markWordForReview error:", err);
      socket.emit("error", "Не можам да го зачувам зборот за преглед.");
    }
  });

  // ---- VOTE REVIEW WORD ----
  socket.on("voteReviewWord", async ({ reviewId, valid }) => {
  try {
    const userId = socket.data.user?.id;
    if (!userId) return;

    const review = await ReviewWord.findById(reviewId);
    if (!review || review.status !== "pending") return;

    // prevent duplicate vote
    const already = review.votes.find((v) => String(v.player) === String(userId));
    if (already) return;

    review.votes.push({ player: userId, valid });
    await review.save();

    // check if enough votes reached
    const totalVotes = review.votes.length;
    const approvals = review.votes.filter((v) => v.valid).length;

    // Example rule: majority approves OR 3+ approvals
    if (approvals >= 2 && approvals > totalVotes / 2) {
      review.status = "accepted";
      review.decidedAt = new Date();
      await review.save();

      const Room = require("../models/Room");
      const room = await Room.findOne({ code: review.roomCode });
      if (room) {
        await Room.updateOne(
          { code: review.roomCode, "roundsData.roundNumber": review.roundNumber },
          {
            $inc: { "roundsData.$[r].submissions.$[s].points": 5 }, // +10 points
          },
          {
            arrayFilters: [
              { "r.roundNumber": review.roundNumber },
              { "s.player": review.submittedBy },
            ],
          }
        );
      }

      // notify everyone
      io.to(review.roomCode).emit("reviewWordDecided", {
        status: "accepted",
        word: review.word,
        player: review.submittedBy,
        points: 10,
      });
    } else if (totalVotes >= 3 && approvals === 0) {
      // all voted reject
      review.status = "rejected";
      review.decidedAt = new Date();
      await review.save();

      io.to(review.roomCode).emit("reviewWordDecided", {
        status: "rejected",
        word: review.word,
        player: review.submittedBy,
      });
    }

    // broadcast updated list so RoundResultsModal refreshes
    const list = await ReviewWord.find({
      roomCode: review.roomCode,
      roundNumber: review.roundNumber,
    }).lean();
    io.to(review.roomCode).emit("reviewWordsUpdated", list);

    socket.emit("reviewVoteRegistered", { success: true });
  } catch (err) {
    console.error("❌ voteReviewWord error:", err);
    socket.emit("reviewVoteRegistered", {
      success: false,
      message: "Грешка при гласање.",
    });
  }
});

}

module.exports = { registerReviewHandlers };
