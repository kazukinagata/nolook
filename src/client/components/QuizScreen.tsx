import { useEffect, useCallback, useRef } from "react";
import type { Question } from "../types";
import ConversationView from "./ConversationView";
import ToolConfirmation from "./ToolConfirmation";
import Timer from "./Timer";
import ProgressBar from "./ProgressBar";

interface FeedbackData {
  correct: boolean;
  correctAnswer: "approve" | "reject";
  explanation: string;
  timedOut?: boolean;
}

interface Props {
  question: Question;
  feedback: FeedbackData | null;
  progress: { answered: number; total: number };
  onAnswer: (answer: "approve" | "reject", timedOut?: boolean) => void;
  onNext: () => void;
  score: number;
}

export default function QuizScreen({
  question,
  feedback,
  progress,
  onAnswer,
  onNext,
  score,
}: Props) {
  const answeredRef = useRef(false);

  useEffect(() => {
    answeredRef.current = !!feedback;
  }, [question.id, feedback]);

  const handleAnswer = useCallback(
    (answer: "approve" | "reject") => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      onAnswer(answer);
    },
    [onAnswer]
  );

  const handleTimeout = useCallback(() => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    onAnswer("reject", true);
  }, [onAnswer]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (feedback) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNext();
        }
        return;
      }

      if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        handleAnswer("approve");
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleAnswer("reject");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [feedback, handleAnswer, onNext]);

  return (
    <div className="quiz-screen">
      <header className="quiz-header">
        <div className="header-left">
          <span className="logo-dot" />
          <span className="header-title">NoLook</span>
        </div>
        <ProgressBar
          current={progress.answered}
          total={progress.total}
        />
        <div className="header-right">
          <span className="score-display">Score: {score}%</span>
        </div>
      </header>

      <main className="quiz-main">
        <ConversationView messages={question.conversation} />

        <ToolConfirmation
          toolName={question.toolName}
          toolParams={question.toolParams}
          onAnswer={handleAnswer}
          disabled={!!feedback}
        />

        {!feedback && (
          <Timer
            key={question.id}
            duration={question.timeLimit}
            onTimeout={handleTimeout}
          />
        )}

        {feedback && (
          <div
            className={`feedback-panel ${
              feedback.timedOut
                ? "timeout"
                : feedback.correct
                  ? "correct"
                  : "incorrect"
            }`}
          >
            <div className="feedback-header">
              <span className="feedback-icon">
                {feedback.timedOut
                  ? "TIME'S UP!"
                  : feedback.correct
                    ? "CORRECT"
                    : "INCORRECT"}
              </span>
              <span className="feedback-answer">
                Correct answer:{" "}
                {feedback.correctAnswer === "approve"
                  ? "Yes (Approve)"
                  : "No (Reject)"}
              </span>
            </div>
            <p className="feedback-explanation">{feedback.explanation}</p>
            <button className="next-btn" onClick={onNext} autoFocus>
              {progress.answered < progress.total
                ? "Next Question"
                : "See Results"}
              <span className="shortcut-hint">Enter</span>
            </button>
          </div>
        )}
      </main>

      <footer className="quiz-footer">
        <span className="shortcut-guide">
          <kbd>Y</kbd> Approve &nbsp; <kbd>N</kbd> Reject &nbsp;{" "}
          <kbd>Enter</kbd> Next
        </span>
        <span
          className="question-category"
          data-difficulty={question.difficulty}
        >
          Difficulty: {question.difficulty.toUpperCase()}
        </span>
      </footer>
    </div>
  );
}
