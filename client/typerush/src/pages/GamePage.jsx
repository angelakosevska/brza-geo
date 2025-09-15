import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// UI
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
    // base state
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
    hasMoreRounds,
    hostId,
    isHost,
    handleChange,
    handleSubmit,
    handleStopRound,
    dictByCategory,

    // round results
    showResults,
    roundScores,
    answerDetails,
    breakLeft,
    handleNextRound,

    // final results
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
        {/* Left side – round info and answer input */}
        <div className="flex flex-col gap-1 lg:col-span-3">
          <RoundInfoCard
            currentRound={currentRound}
            totalRounds={totalRounds}
            timeLeft={endAt ? timeLeft : null}
            letter={letter}
            waiting={waitingForRound}
          />

          <CategoryAnswersCard
            title="Enter your answers"
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
            dictByCategory={dictByCategory}
          />
        </div>

        {/* Right side – players list */}
        <div className="lg:col-span-1">
          <PlayersList
            players={players}
            className="w-full h-full"
            showLeave={false}
            hostId={hostId}
          />
        </div>
      </div>

      {/* Round results modal */}
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
        hasMoreRounds={hasMoreRounds}
        onNextRound={handleNextRound}
      />

      {/* Final results modal */}
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
