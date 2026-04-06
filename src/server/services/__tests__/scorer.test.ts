import { describe, it, expect, beforeEach } from "vitest";
import { Scorer } from "../scorer.js";
import type { Category, Difficulty } from "../../types.js";
import { CATEGORIES } from "../../types.js";

describe("Scorer", () => {
  let scorer: Scorer;

  beforeEach(() => {
    scorer = new Scorer();
  });

  describe("recordAnswer", () => {
    it("adds entries that are reflected in getCurrentScore", () => {
      scorer.recordAnswer("safe", "easy", true);
      expect(scorer.getCurrentScore()).toBe(100);

      scorer.recordAnswer("safe", "easy", false);
      expect(scorer.getCurrentScore()).toBe(50);
    });
  });

  describe("getCurrentScore", () => {
    it("returns 0 when no answers recorded", () => {
      expect(scorer.getCurrentScore()).toBe(0);
    });

    it("returns 100 when all answers correct", () => {
      scorer.recordAnswer("destructive", "easy", true);
      scorer.recordAnswer("external", "medium", true);
      scorer.recordAnswer("safe", "hard", true);
      expect(scorer.getCurrentScore()).toBe(100);
    });

    it("returns rounded percentage for partial correctness", () => {
      scorer.recordAnswer("safe", "easy", true);
      scorer.recordAnswer("safe", "easy", false);
      scorer.recordAnswer("safe", "easy", true);
      // 2/3 = 66.67 → 67
      expect(scorer.getCurrentScore()).toBe(67);
    });

    it("returns 0 when all answers wrong", () => {
      scorer.recordAnswer("safe", "easy", false);
      scorer.recordAnswer("safe", "medium", false);
      expect(scorer.getCurrentScore()).toBe(0);
    });
  });

  describe("getCategoryScores", () => {
    it("returns zeros for all categories when empty", () => {
      const scores = scorer.getCategoryScores();
      for (const cat of CATEGORIES) {
        expect(scores[cat]).toEqual({ correct: 0, total: 0 });
      }
    });

    it("tracks multiple categories independently", () => {
      scorer.recordAnswer("destructive", "easy", true);
      scorer.recordAnswer("destructive", "medium", false);
      scorer.recordAnswer("safe", "easy", true);

      const scores = scorer.getCategoryScores();
      expect(scores.destructive).toEqual({ correct: 1, total: 2 });
      expect(scores.safe).toEqual({ correct: 1, total: 1 });
      expect(scores.external).toEqual({ correct: 0, total: 0 });
    });
  });

  describe("getResults", () => {
    describe("rank thresholds", () => {
      function buildScorer(correct: number, total: number): Scorer {
        const s = new Scorer();
        for (let i = 0; i < correct; i++) {
          s.recordAnswer("safe", "easy", true);
        }
        for (let i = 0; i < total - correct; i++) {
          s.recordAnswer("safe", "easy", false);
        }
        return s;
      }

      it("returns Beginner for accuracy < 0.40", () => {
        // 39/100 = 0.39
        expect(buildScorer(39, 100).getResults().rank).toBe("Beginner");
      });

      it("returns Beginner at 0 accuracy", () => {
        expect(buildScorer(0, 10).getResults().rank).toBe("Beginner");
      });

      it("returns Rookie at exactly 0.40", () => {
        // 40/100 = 0.40
        expect(buildScorer(40, 100).getResults().rank).toBe("Rookie");
      });

      it("returns Rookie just below 0.55", () => {
        // 54/100 = 0.54
        expect(buildScorer(54, 100).getResults().rank).toBe("Rookie");
      });

      it("returns Middle at exactly 0.55", () => {
        expect(buildScorer(55, 100).getResults().rank).toBe("Middle");
      });

      it("returns Middle just below 0.70", () => {
        expect(buildScorer(69, 100).getResults().rank).toBe("Middle");
      });

      it("returns Senior at exactly 0.70", () => {
        expect(buildScorer(70, 100).getResults().rank).toBe("Senior");
      });

      it("returns Senior just below 0.85", () => {
        expect(buildScorer(84, 100).getResults().rank).toBe("Senior");
      });

      it("returns Expert at exactly 0.85", () => {
        expect(buildScorer(85, 100).getResults().rank).toBe("Expert");
      });

      it("returns Expert just below 0.95", () => {
        expect(buildScorer(94, 100).getResults().rank).toBe("Expert");
      });

      it("returns Master at exactly 0.95", () => {
        expect(buildScorer(95, 100).getResults().rank).toBe("Master");
      });

      it("returns Master at 100%", () => {
        expect(buildScorer(100, 100).getResults().rank).toBe("Master");
      });
    });

    it("returns radarData with all 5 categories", () => {
      scorer.recordAnswer("destructive", "easy", true);
      const results = scorer.getResults();

      expect(results.radarData).toHaveLength(5);
      const categories = results.radarData.map((r) => r.category);
      expect(categories).toEqual(CATEGORIES);
    });

    it("computes radarData accuracy per category", () => {
      scorer.recordAnswer("destructive", "easy", true);
      scorer.recordAnswer("destructive", "medium", false);
      scorer.recordAnswer("safe", "easy", true);

      const results = scorer.getResults();
      const destructiveRadar = results.radarData.find(
        (r) => r.category === "destructive"
      );
      expect(destructiveRadar?.accuracy).toBe(50);

      const safeRadar = results.radarData.find((r) => r.category === "safe");
      expect(safeRadar?.accuracy).toBe(100);

      const externalRadar = results.radarData.find(
        (r) => r.category === "external"
      );
      expect(externalRadar?.accuracy).toBe(0);
    });

    it("calculates avgDifficulty correctly", () => {
      // easy=0, medium=1, hard=2
      scorer.recordAnswer("safe", "easy", true);
      scorer.recordAnswer("safe", "medium", true);
      scorer.recordAnswer("safe", "hard", true);
      // (0 + 1 + 2) / 3 = 1.0
      expect(scorer.getResults().avgDifficulty).toBe(1);
    });

    it("calculates avgDifficulty with rounding", () => {
      scorer.recordAnswer("safe", "easy", true);
      scorer.recordAnswer("safe", "medium", true);
      // (0 + 1) / 2 = 0.5
      expect(scorer.getResults().avgDifficulty).toBe(0.5);
    });

    it("returns avgDifficulty 1 when no answers", () => {
      expect(scorer.getResults().avgDifficulty).toBe(1);
    });

    it("includes totalCorrect and totalQuestions", () => {
      scorer.recordAnswer("safe", "easy", true);
      scorer.recordAnswer("safe", "easy", false);
      scorer.recordAnswer("safe", "easy", true);

      const results = scorer.getResults();
      expect(results.totalCorrect).toBe(2);
      expect(results.totalQuestions).toBe(3);
      expect(results.score).toBe(67);
    });

    it("includes categoryBreakdown with accuracy", () => {
      scorer.recordAnswer("privilege", "hard", true);
      scorer.recordAnswer("privilege", "hard", false);

      const results = scorer.getResults();
      expect(results.categoryBreakdown.privilege).toEqual({
        correct: 1,
        total: 2,
        accuracy: 50,
      });
      expect(results.categoryBreakdown.safe).toEqual({
        correct: 0,
        total: 0,
        accuracy: 0,
      });
    });
  });
});
