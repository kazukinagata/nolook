import type { Category, GameResults, Difficulty } from "../types.js";
import { CATEGORIES, CATEGORY_LABELS } from "../types.js";

interface AnswerRecord {
  category: Category;
  difficulty: Difficulty;
  correct: boolean;
}

export class Scorer {
  private answers: AnswerRecord[] = [];

  recordAnswer(
    category: Category,
    difficulty: Difficulty,
    correct: boolean
  ): void {
    this.answers.push({ category, difficulty, correct });
  }

  getCurrentScore(): number {
    if (this.answers.length === 0) return 0;
    const correct = this.answers.filter((a) => a.correct).length;
    return Math.round((correct / this.answers.length) * 100);
  }

  getCategoryScores(): Record<
    Category,
    { correct: number; total: number }
  > {
    const scores = Object.fromEntries(
      CATEGORIES.map((cat) => {
        const catAnswers = this.answers.filter((a) => a.category === cat);
        return [
          cat,
          {
            correct: catAnswers.filter((a) => a.correct).length,
            total: catAnswers.length,
          },
        ];
      })
    ) as Record<Category, { correct: number; total: number }>;
    return scores;
  }

  getResults(): GameResults {
    const categoryScores = this.getCategoryScores();
    const totalCorrect = this.answers.filter((a) => a.correct).length;
    const totalQuestions = this.answers.length;
    const overallAccuracy =
      totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

    // Simple score — no difficulty weighting
    const rank = calculateRank(overallAccuracy);

    const radarData = CATEGORIES.map((cat) => {
      const s = categoryScores[cat];
      return {
        category: cat,
        label: CATEGORY_LABELS[cat],
        accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      };
    });

    const categoryBreakdown = Object.fromEntries(
      CATEGORIES.map((cat) => {
        const s = categoryScores[cat];
        return [
          cat,
          {
            ...s,
            accuracy:
              s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
          },
        ];
      })
    ) as Record<Category, { correct: number; total: number; accuracy: number }>;

    // avgDifficulty kept as reference info
    const avgDifficulty =
      this.answers.length > 0
        ? this.answers.reduce(
            (sum, a) => sum + difficultyValue(a.difficulty),
            0
          ) / this.answers.length
        : 1;

    return {
      score: Math.round(overallAccuracy * 100),
      rank,
      radarData,
      categoryBreakdown,
      totalCorrect,
      totalQuestions,
      avgDifficulty: Math.round(avgDifficulty * 100) / 100,
    };
  }
}

function calculateRank(accuracy: number): string {
  if (accuracy >= 0.95) return "Master";
  if (accuracy >= 0.85) return "Expert";
  if (accuracy >= 0.7) return "Senior";
  if (accuracy >= 0.55) return "Middle";
  if (accuracy >= 0.4) return "Rookie";
  return "Beginner";
}

function difficultyValue(d: Difficulty): number {
  return { easy: 0, medium: 1, hard: 2 }[d];
}
