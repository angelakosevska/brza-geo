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

      // ❌ Авторот не смее да гласа за свој збор
      if (String(review.submittedBy) === String(userId)) {
        return socket.emit("reviewVoteRegistered", {
          success: false,
          message: "Не можеш да гласаш за сопствениот збор.",
        });
      }

      // ❌ Спречи дупликат глас
      const already = review.votes.find(
        (v) => String(v.player) === String(userId)
      );
      if (already) {
        return socket.emit("reviewVoteRegistered", {
          success: false,
          message: "Веќе гласавте за овој збор.",
        });
      }

      // ✅ Додај нов глас
      review.votes.push({ player: userId, valid });
      await review.save();

      // ---------- ЛОГИКА ЗА ПОЕНИ ----------
      const totalVotes = review.votes.length;
      const approvals = review.votes.filter((v) => v.valid).length;

      // Ако има доволно approve (пример ≥2 и мнозинство) и сè уште нема поени дадено
      if (!review.awarded && approvals >= 2 && approvals > totalVotes / 2) {
        review.awarded = true; // ✅ означи дека поени се дадени
        await review.save();

        // Додели поени на играчот
        await Room.updateOne(
          {
            code: review.roomCode,
            "roundsData.roundNumber": review.roundNumber,
          },
          {
            $inc: { "roundsData.$[r].submissions.$[s].points": 5 },
          },
          {
            arrayFilters: [
              { "r.roundNumber": review.roundNumber },
              { "s.player": review.submittedBy },
            ],
          }
        );

        // Извести ги сите
        io.to(review.roomCode).emit("reviewWordDecided", {
          status: "accepted",
          word: review.word,
          player: review.submittedBy,
          points: 5,
        });
      }

      // Ако сите гласале reject (пример ≥3 и 0 approvals) → само update статус
      if (totalVotes >= 3 && approvals === 0) {
        review.status = "rejected";
        review.decidedAt = new Date();
        await review.save();

        io.to(review.roomCode).emit("reviewWordDecided", {
          status: "rejected",
          word: review.word,
          player: review.submittedBy,
        });
      }

      // Секогаш прати освежена листа
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
