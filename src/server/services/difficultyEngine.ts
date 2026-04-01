import type { Category, Difficulty } from "../types.js";
import { CATEGORIES } from "../types.js";

interface CategoryState {
  history: boolean[];
  currentDifficulty: Difficulty;
  totalAsked: number;
}

export class DifficultyEngine {
  private state: Record<Category, CategoryState>;

  constructor() {
    this.state = {} as Record<Category, CategoryState>;
    for (const cat of CATEGORIES) {
      this.state[cat] = {
        history: [],
        currentDifficulty: "medium",
        totalAsked: 0,
      };
    }
  }

  recordAnswer(category: Category, correct: boolean): void {
    const s = this.state[category];
    s.history.push(correct);
    s.totalAsked++;

    // Adjust difficulty based on rolling window of last 5
    const window = s.history.slice(-5);
    if (window.length >= 3) {
      const accuracy = window.filter(Boolean).length / window.length;
      if (accuracy >= 0.8) {
        s.currentDifficulty = harder(s.currentDifficulty);
      } else if (accuracy <= 0.4) {
        s.currentDifficulty = easier(s.currentDifficulty);
      }
    }
  }

  getNextCategoryAndDifficulty(totalAnswered: number): {
    category: Category;
    difficulty: Difficulty;
  } {
    const category = this.selectCategory(totalAnswered);
    return {
      category,
      difficulty: this.state[category].currentDifficulty,
    };
  }

  private selectCategory(totalAnswered: number): Category {
    // Ensure minimum coverage: each category gets at least 6 questions over 50
    const minPerCategory = 6;
    const remaining = 50 - totalAnswered;

    // Find categories that need more questions to meet minimum
    const underserved = CATEGORIES.filter(
      (cat) =>
        this.state[cat].totalAsked < minPerCategory &&
        remaining > 0
    );

    if (underserved.length > 0) {
      // Check if any category MUST get questions to meet minimum
      const urgent = underserved.filter((cat) => {
        const needed = minPerCategory - this.state[cat].totalAsked;
        const slotsLeft = remaining;
        return needed >= slotsLeft * 0.5; // Getting tight
      });

      if (urgent.length > 0) {
        return urgent[Math.floor(Math.random() * urgent.length)];
      }
    }

    // Weighted random: weaker categories get more weight
    const weights = CATEGORIES.map((cat) => {
      const s = this.state[cat];
      const accuracy =
        s.history.length > 0
          ? s.history.filter(Boolean).length / s.history.length
          : 0.5;
      // Lower accuracy = higher weight (focus on weaknesses)
      // Fewer questions = higher weight (ensure coverage)
      const accuracyWeight = 1 - accuracy + 0.3;
      const coverageWeight = Math.max(0, 1 - s.totalAsked / 12);
      return accuracyWeight + coverageWeight;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < CATEGORIES.length; i++) {
      random -= weights[i];
      if (random <= 0) return CATEGORIES[i];
    }

    return CATEGORIES[CATEGORIES.length - 1];
  }

  getDifficultyForCategory(category: Category): Difficulty {
    return this.state[category].currentDifficulty;
  }

  getAverageDifficulty(): number {
    let total = 0;
    let count = 0;
    for (const cat of CATEGORIES) {
      for (const _entry of this.state[cat].history) {
        total += difficultyValue(this.state[cat].currentDifficulty);
        count++;
      }
    }
    return count > 0 ? total / count : 1;
  }
}

function harder(d: Difficulty): Difficulty {
  if (d === "easy") return "medium";
  if (d === "medium") return "hard";
  return "hard";
}

function easier(d: Difficulty): Difficulty {
  if (d === "hard") return "medium";
  if (d === "medium") return "easy";
  return "easy";
}

function difficultyValue(d: Difficulty): number {
  return { easy: 0, medium: 1, hard: 2 }[d];
}
