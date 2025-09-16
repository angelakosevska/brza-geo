import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// UI компоненти
import PlayersList from "@/components/PlayersList";
import RoundInfoCard from "@/components/game/RoundInfoCard";
import CategoryAnswersCard from "@/components/game/CategoryAnswersCard";
import RoundResultsModal from "@/components/game/RoundResultModal";
import FinalResultsModal from "@/components/game/FinalResultsModal";

// Логика
import useGameLogic from "@/hooks/useGameLogic";

export default function GamePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id;

  // ✅ Сите state-ови и хендлери од custom hook-от
  const {
    // основна состојба
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
    wpEarned,
    handleChange,
    handleSubmit,
    handleStopRound,
    dictByCategory,

    // резултати по рунда
    showResults,
    roundScores,
    answerDetails,
    breakLeft,
    handleNextRound,

    // финални резултати
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
      {/* Горен дел: левата страна е рундата и одговорите, десната страна е листата на играчи */}
      <div className="gap-1 grid grid-cols-1 lg:grid-cols-4 max-h-[60vh]">
        {/* Лева страна – информации за рундата и внес на одговори */}
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
            dictByCategory={dictByCategory}
          />
        </div>

        {/* Десна страна – листа на играчи */}
        <div className="lg:col-span-1">
          <PlayersList
            players={players}
            className="w-full h-full"
            showLeave={false}
            hostId={hostId}
          />
        </div>
      </div>

      {/* Модал со резултати по рунда */}
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

      {/* Финален модал со резултати и добиен Word Power */}
      <FinalResultsModal
        show={showFinal}
        code={code}
        playerNameById={playerNameById}
        finalTotals={finalTotals}
        finalWinners={finalWinners}
        wpEarned={wpEarned}
        isHost={isHost}
        onBackToRoom={handleBackToRoom}
        onLeaveToMain={handleLeaveRoom}
        onStartNewGame={handlePlayAgain}
        onRequestClose={handleStayHere}
      />
    </div>
  );
}
