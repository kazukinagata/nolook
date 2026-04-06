import type { Language, QuestionWithAnswer } from "./types.js";
import { TIME_LIMIT_MS } from "./types.js";
import { enQuestions } from "./data/questions-en.js";
import { jaQuestions } from "./data/questions-ja.js";

function toQuestionWithAnswer(
  questions: typeof enQuestions,
): QuestionWithAnswer[] {
  return questions.map((q, i) => ({ ...q, id: i + 1, timeLimit: TIME_LIMIT_MS }));
}

const staticQuestionsByLanguage: Record<Language, QuestionWithAnswer[]> = {
  en: toQuestionWithAnswer(enQuestions),
  ja: toQuestionWithAnswer(jaQuestions),
};

export function getStaticQuestions(language: Language): QuestionWithAnswer[] {
  return staticQuestionsByLanguage[language] || staticQuestionsByLanguage.en;
}
