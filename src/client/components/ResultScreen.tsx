import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { GameResults } from "../types";

interface Props {
  results: GameResults;
  onRestart: () => void;
}

const rankColors: Record<string, string> = {
  Master: "#ffd700",
  Expert: "#c084fc",
  Senior: "#60a5fa",
  Middle: "#34d399",
  Rookie: "#fb923c",
  Beginner: "#94a3b8",
};

const rankDescriptions: Record<string, string> = {
  Master:
    "Flawless judgment. You never let a dangerous command slip through.",
  Expert:
    "Sharp instincts. You catch almost everything — even the tricky ones.",
  Senior:
    "Solid fundamentals. You handle most scenarios with confidence.",
  Middle:
    "Getting there. You know the basics but edge cases trip you up.",
  Rookie:
    "Room to grow. Time to brush up on what makes a command dangerous.",
  Beginner:
    "Just starting out. Every mistake is a learning opportunity!",
};

export default function ResultScreen({ results, onRestart }: Props) {
  const rankColor = rankColors[results.rank] || "#94a3b8";

  return (
    <div className="result-screen">
      <div className="result-content">
        <div className="rank-section">
          <div className="rank-badge" style={{ borderColor: rankColor }}>
            <span className="rank-label">Your Rank</span>
            <span className="rank-name" style={{ color: rankColor }}>
              {results.rank}
            </span>
          </div>
          <p className="rank-description">
            {rankDescriptions[results.rank]}
          </p>
        </div>

        <div className="score-summary">
          <div className="score-stat">
            <span className="stat-value">{results.totalCorrect}</span>
            <span className="stat-label">
              / {results.totalQuestions} correct
            </span>
          </div>
          <div className="score-stat">
            <span className="stat-value">{results.score}%</span>
            <span className="stat-label">weighted score</span>
          </div>
        </div>

        <div className="radar-section">
          <h2>Category Breakdown</h2>
          <div className="radar-container">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart
                data={results.radarData}
                margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
              >
                <PolarGrid stroke="#30363d" />
                <PolarAngleAxis
                  dataKey="label"
                  tick={{ fill: "#8b949e", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#484f58", fontSize: 10 }}
                  axisLine={false}
                />
                <Radar
                  name="Accuracy"
                  dataKey="accuracy"
                  stroke="#1f6feb"
                  fill="#1f6feb"
                  fillOpacity={0.3}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="category-details">
          {results.radarData.map((cat) => {
            const detail =
              results.categoryBreakdown[
                cat.category as keyof typeof results.categoryBreakdown
              ];
            return (
              <div key={cat.category} className="category-row">
                <span className="cat-label">{cat.label}</span>
                <div className="cat-bar-track">
                  <div
                    className="cat-bar-fill"
                    style={{
                      width: `${cat.accuracy}%`,
                      backgroundColor:
                        cat.accuracy >= 80
                          ? "#238636"
                          : cat.accuracy >= 50
                            ? "#d29922"
                            : "#da3633",
                    }}
                  />
                </div>
                <span className="cat-score">
                  {detail.correct}/{detail.total} ({cat.accuracy}%)
                </span>
              </div>
            );
          })}
        </div>

        <button className="restart-btn" onClick={onRestart}>
          Try Again
        </button>
      </div>
    </div>
  );
}
