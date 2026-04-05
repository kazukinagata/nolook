import { useGame } from "./hooks/useGame";
import StartScreen from "./components/StartScreen";
import QuizScreen from "./components/QuizScreen";
import ResultScreen from "./components/ResultScreen";

export default function App() {
  const game = useGame();

  switch (game.phase) {
    case "start":
      return <StartScreen onStart={game.startGame} />;
    case "playing":
    case "animating":
    case "feedback":
      return (
        <QuizScreen
          question={game.question!}
          feedback={game.phase === "feedback" ? game.feedback! : null}
          animating={game.phase === "animating"}
          animationCorrect={game.feedback?.correct ?? false}
          onAnimationComplete={game.finishAnimation}
          skipAnimation={game.skipAnimation}
          progress={game.progress}
          onAnswer={game.submitAnswer}
          onNext={game.nextQuestion}
          score={game.score}
          submitting={game.submitting}
        />
      );
    case "results":
      return (
        <ResultScreen
          results={game.results!}
          onRestart={() => window.location.reload()}
        />
      );
  }
}
