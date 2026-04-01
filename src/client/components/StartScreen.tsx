import { useState } from "react";
import type { Language } from "../types";

interface Props {
  onStart: (language: Language) => void;
}

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "EN" },
  { code: "ja", label: "Japanese", flag: "JP" },
  { code: "ko", label: "Korean", flag: "KR" },
  { code: "zh", label: "Chinese", flag: "CN" },
];

export default function StartScreen({ onStart }: Props) {
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    setLoading(true);
    onStart(language);
  };

  return (
    <div className="start-screen">
      <div className="start-content">
        <div className="logo">
          <span className="logo-dot" />
          <h1>NoLook</h1>
        </div>
        <p className="tagline">
          Can you tell safe tool calls from dangerous ones?
        </p>
        <p className="description">
          50 Claude Code approval prompts. 20 seconds each.
          <br />
          Approve what's safe. Reject what's not.
        </p>

        <div className="language-selector">
          <label>Conversation Language</label>
          <div className="language-options">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`language-btn ${
                  language === lang.code ? "selected" : ""
                }`}
                onClick={() => setLanguage(lang.code)}
              >
                <span className="lang-flag">{lang.flag}</span>
                <span className="lang-label">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          className="start-btn"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? (
            <span className="loading-text">
              <span className="spinner" />
              Generating questions...
            </span>
          ) : (
            "Start Test"
          )}
        </button>

        <div className="start-info">
          <div className="info-item">
            <span className="info-icon">50</span>
            <span>Questions</span>
          </div>
          <div className="info-item">
            <span className="info-icon">20s</span>
            <span>Per question</span>
          </div>
          <div className="info-item">
            <span className="info-icon">5</span>
            <span>Categories</span>
          </div>
        </div>
      </div>
    </div>
  );
}
