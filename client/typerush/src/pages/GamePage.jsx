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
    endMode,
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
    <div>
      <div className="gap-1 grid grid-cols-1 lg:grid-cols-4 max-h-[60vh]">
        {/* Left side: info + answers + placeholder */}
        <div className="flex flex-col gap-1 lg:col-span-3">
          <RoundInfoCard
            currentRound={currentRound}
            totalRounds={totalRounds}
            timeLeft={endAt ? timeLeft : null}
            letter={letter}
            waiting={waitingForRound}
          />

          <CategoryAnswersCard
            title="Внеси ги твоите одговори"
            categories={categories}
            categoryLabels={categoryLabels}
            letter={letter}
            answers={answers}
            onChange={handleChange}
            submitted={submitted}
            timeLeft={timeLeft}
            enforceStartsWith={false}
            mode={mode}
            waitingForRound={waitingForRound}
            showSubmit={endMode === "ALL_SUBMIT"}
            showStop={endMode === "PLAYER_STOP"}
            isHost={isHost}
            onSubmit={handleSubmit}
            onStop={handleStopRound}
            code={code}
          />

          <GlassCard className="overflow-hidden">
            <div className="flex justify-center items-center p-6 max-h-25">
              <div className="flex justify-center items-center rounded-2xl w-full h-[240px]">
                <span className="opacity-80">📸 Placeholder</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right side: players */}
        <div className="lg:col-span-1">
          <PlayersList
            players={players}
            className="w-full h-full"
            showLeave={false}
          />
        </div>
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
