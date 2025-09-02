import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// UI
import GlassCard from "@/components/GlassCard";
import PlayersList from "@/components/PlayersList";
import RoundInfoCard from "@/components/game/RoundInfoCard";
import CategoryAnswersCard from "@/components/game/CategoryAnswersCard";
import RoundResultsModal from "@/components/game/RoundResultModal";
import FinalResultsModal from "@/components/game/FinalResultsModal";

// Logic
import useGameLogic from "@/hooks/useGameLogic";

export default function GamePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id;

  const {
    // base
    players,
    currentRound,
    totalRounds,
    letter,
    endAt,
    timeLeft,
    waitingForRound,
    categories,
    categoryLabels,
    answers,
    submitted,
    // NEW (ensure your hook returns these)
    mode,
    isHost,
    handleChange,
    handleSubmit,
    handleStopRound,

    // modals
    showResults,
    roundScores,
    answerDetails,
    breakLeft,
    handleNextRound,
    showFinal,
    finalTotals,
    finalWinners,
    playerNameById,
    handleBackToRoom,
    handleLeaveRoom,
    handlePlayAgain,
    handleStayHere,
  } = useGameLogic({ code, currentUserId, navigate });

  return (
    <div className="py-6">
      <div className="gap-4 grid grid-cols-1 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <RoundInfoCard
            className="order-1 lg:order-2"
            currentRound={currentRound}
            totalRounds={totalRounds}
            timeLeft={endAt ? timeLeft : null}
            letter={letter}
            waiting={waitingForRound}
          />

          <CategoryAnswersCard
            className="order-3"
            title="Внеси ги твоите одговори"
            categories={categories}
            categoryLabels={categoryLabels}
            letter={letter}
            answers={answers}
            onChange={handleChange}
            submitted={submitted}
            timeLeft={timeLeft}
            enforceStartsWith={false}
            // IMPORTANT:
            mode={mode}
            waitingForRound={waitingForRound}
            showSubmit
            showStop={endMode ==="PLAYER_STOP"}
            isHost={isHost}
            onSubmit={handleSubmit}
            onStop={handleStopRound}
            code={code}
          />

          <div className="order-4 lg:order-1">
            <PlayersList
              players={players}
              className="w-full"
              showLeave={false}
            />
          </div>
        </div>

        <GlassCard className="lg:col-span-1 p-0 overflow-hidden">
          <div className="flex justify-center items-center p-6 h-full min-h-[300px]">
            <div className="flex justify-center items-center rounded-2xl w-full h-[340px]">
              <span className="opacity-80">Placeholder</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Modals */}
      <RoundResultsModal
        show={showResults}
        isHost={isHost}
        currentRound={currentRound}
        totalRounds={totalRounds}
        categories={categories}
        categoryLabels={categoryLabels}
        players={players}
        playerNameById={playerNameById}
        answerDetails={answerDetails}
        roundScores={roundScores}
        breakLeft={breakLeft}
        onNextRound={handleNextRound}
      />
      <FinalResultsModal
        show={showFinal}
        code={code}
        playerNameById={playerNameById}
        finalTotals={finalTotals}
        finalWinners={finalWinners}
        isHost={isHost}
        onBackToRoom={handleBackToRoom}
        onLeaveToMain={handleLeaveRoom}
        onStartNewGame={handlePlayAgain}
        onRequestClose={handleStayHere}
      />
    </div>
  );
}
