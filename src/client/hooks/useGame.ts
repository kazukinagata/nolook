import { useState, useCallback } from "react";
import type {
  GamePhase,
  Language,
  Question,
  AnswerResult,
  GameResults,
} from "../types";

interface FeedbackData {
  correct: boolean;
  correctAnswer: "approve" | "reject";
  explanation: string;
  timedOut?: boolean;
}

interface GameState {
  phase: GamePhase;
  gameId: string | null;
  question: Question | null;
  feedback: FeedbackData | null;
  nextQuestionCache: Question | null;
  progress: { answered: number; total: number };
  score: number;
  results: GameResults | null;
  loading: boolean;
  submitting: boolean;
}

export function useGame() {
  const [state, setState] = useState<GameState>({
    phase: "start",
    gameId: null,
    question: null,
    feedback: null,
    nextQuestionCache: null,
    progress: { answered: 0, total: 50 },
    score: 0,
    results: null,
    loading: false,
    submitting: false,
  });

  const startGame = useCallback(async (language: Language) => {
    setState((s) => ({ ...s, loading: true }));

    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      const data = await res.json();

      setState({
        phase: "playing",
        gameId: data.gameId,
        question: data.question,
        feedback: null,
        nextQuestionCache: null,
        progress: { answered: 0, total: 50 },
        score: 0,
        results: null,
        loading: false,
        submitting: false,
      });
    } catch (err) {
      console.error("Failed to start game:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const submitAnswer = useCallback(
    async (answer: "approve" | "reject", timedOut = false) => {
      if (!state.gameId || state.phase !== "playing" || state.submitting) return;

      setState((s) => ({ ...s, submitting: true }));

      try {
        const res = await fetch(`/api/game/${state.gameId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer }),
        });
        const data: AnswerResult = await res.json();

        setState((s) => ({
          ...s,
          phase: "feedback",
          submitting: false,
          feedback: {
            correct: data.correct,
            correctAnswer: data.correctAnswer,
            explanation: data.explanation,
            timedOut,
          },
          nextQuestionCache: data.nextQuestion,
          progress: {
            answered: data.progress.answered,
            total: data.progress.total,
          },
          score: data.currentScore,
        }));
      } catch (err) {
        console.error("Failed to submit answer:", err);
        setState((s) => ({ ...s, submitting: false }));
      }
    },
    [state.gameId, state.phase, state.submitting]
  );

  const nextQuestion = useCallback(async () => {
    if (state.nextQuestionCache) {
      // Notify server that the question is now displayed, so the timer starts
      if (state.gameId) {
        fetch(`/api/game/${state.gameId}/serve`, { method: "POST" }).catch(() => {});
      }
      setState((s) => ({
        ...s,
        phase: "playing",
        question: s.nextQuestionCache,
        feedback: null,
        nextQuestionCache: null,
      }));
    } else {
      if (!state.gameId) return;
      try {
        const res = await fetch(`/api/game/${state.gameId}/results`);
        const results: GameResults = await res.json();
        setState((s) => ({
          ...s,
          phase: "results",
          results,
        }));
      } catch (err) {
        console.error("Failed to fetch results:", err);
      }
    }
  }, [state.nextQuestionCache, state.gameId]);

  return {
    ...state,
    startGame,
    submitAnswer,
    nextQuestion,
  };
}
