import type { Language, AnswerHistoryEntry, GameResults } from "./types.js";
import { CATEGORY_LABELS } from "./types.js";

const categoryDescriptions: Record<string, Record<Language, string>> = {
  destructive: {
    en: "Destructive operations - commands that delete files, overwrite files with cp/mv without backup, reset git history, drop databases, force push, recursive tar extraction overwriting existing files, find -exec rm, etc.",
    ja: "破壊的操作 - ファイル削除、cp/mvでバックアップなしの上書き、gitリセット、データベースドロップ、フォースプッシュ、tar展開による既存ファイル上書き、find -exec rmなど。",
  },
  external: {
    en: "External communications - commands that push code, make API calls, send messages, post to external services, scp/rsync files to remote servers.",
    ja: "外部通信 - コードプッシュ、API呼び出し、メッセージ送信、外部サービスへのポスト、scp/rsyncでリモートサーバーへファイル転送など。",
  },
  privilege: {
    en: "Privilege and authentication - commands using sudo, changing permissions with chmod/chown, accessing credentials or .env files.",
    ja: "権限・認証 - sudo使用、chmod/chownによる権限変更、認証情報や.envファイルへのアクセスなど。",
  },
  data_modification: {
    en: "Data modification - commands that edit files, write to databases, change configs, install/remove packages, copy/move/rename files.",
    ja: "データ変更 - ファイル編集、DB書き込み、設定変更、パッケージのインストール/削除、ファイルのコピー/移動/リネームなど。",
  },
  safe: {
    en: "Safe Bash operations - read-only commands like ls, cat, git status, git log, npm test, grep, diff, head, tail.",
    ja: "安全なBash操作 - ls、cat、git status、git log、npm test、grep、diff、head、tailなどの読み取り専用コマンド。",
  },
};

export function buildBatchPrompt(
  count: number,
  language: Language
): string {
  const langName = { en: "English", ja: "Japanese" }[language];

  const categories = Object.keys(categoryDescriptions);
  const specs: string[] = [];
  for (let i = 0; i < count; i++) {
    const cat = categories[i % categories.length];
    const difficulties = ["easy", "medium", "hard"];
    const diff = difficulties[i % difficulties.length];
    specs.push(`Question ${i + 1}: Category="${cat}" (${categoryDescriptions[cat][language]}), Difficulty=${diff}`);
  }

  return `You are generating ${count} quiz questions for "NoLook", a game that tests whether users can correctly approve or reject Claude Code tool execution confirmations.

Generate ${count} realistic Claude Code scenarios where an AI coding assistant is working on a task and requests permission to execute a tool.

Each question has its own category and difficulty:

${specs.join("\n\n")}

DIFFICULTY GUIDELINES:
- EASY: Obvious scenarios. Dangerous commands are clearly dangerous, safe commands are clearly safe.
- MEDIUM: Context-dependent. The command looks fine but doesn't match what the user asked for, or vice versa.
- HARD: Subtly tricky. Hidden flags, regex bugs, scope mismatches that require deep understanding.

IMPORTANT RULES (apply to ALL questions):
- The conversation messages must be in ${langName}
- The toolName should be one of: "Bash", "Write", "Edit"
- Do NOT use "Read", "Glob", or "Grep" as toolName
- For Bash tools, toolParams should have a "command" field with the shell command
- For Write/Edit tools, toolParams should have a "file_path" field and relevant content fields
- Make each scenario realistic - something that could actually happen during a coding session
- Each conversation should be 2-4 messages
- Each explanation MUST be written in ${langName}. For REJECT answers: (1) what the command does, (2) why it should be rejected, (3) what the correct/safer approach would be. For APPROVE answers: (1) what the command does, (2) why it is safe and matches the request. Keep explanations to 2-4 sentences.
- Do NOT create ambiguous scenarios. The correct answer must be clear.
- Each question MUST be unique`;
}

export function buildFeedbackPrompt(
  answerHistory: AnswerHistoryEntry[],
  results: GameResults,
  language: Language
): string {
  const langName = { en: "English", ja: "Japanese" }[language];

  const mistakes = answerHistory.filter((a) => !a.correct);
  const mistakeSummary = mistakes
    .map((m, i) => {
      return `${i + 1}. [${m.category}] Tool: ${m.toolName}, User answered "${m.userAnswer}" but correct was "${m.correctAnswer}". Context: ${m.conversationSummary}`;
    })
    .join("\n");

  const categoryBreakdown = Object.entries(results.categoryBreakdown)
    .map(([cat, data]) => `- ${CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}: ${data.correct}/${data.total} (${data.accuracy}%)`)
    .join("\n");

  return `You are an expert evaluator for "NoLook", a quiz game testing Claude Code tool confirmation judgment.

The player just finished a ${results.totalQuestions}-question game. Provide personalized feedback in ${langName}.

RESULTS:
- Score: ${results.score}% (${results.totalCorrect}/${results.totalQuestions} correct)
- Rank: ${results.rank}

CATEGORY BREAKDOWN:
${categoryBreakdown}

${mistakes.length > 0 ? `MISTAKES (${mistakes.length} total):\n${mistakeSummary}` : "No mistakes — perfect score!"}

INSTRUCTIONS:
- Write a brief, encouraging evaluation (3-5 paragraphs)
- Highlight specific patterns in their mistakes (if any)
- Give concrete tips for improvement based on their weak categories
- If they scored perfectly, congratulate them and share advanced tips
- Be specific — reference actual mistakes they made, don't be generic
- Use markdown formatting for readability
- Write entirely in ${langName}`;
}

const singleQuestionSchemaObj = {
  type: "object",
  properties: {
    conversation: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["user", "assistant"] },
          content: { type: "string" },
        },
        required: ["role", "content"],
      },
    },
    toolName: { type: "string", enum: ["Bash", "Write", "Edit"] },
    toolParams: { type: "object" },
    correctAnswer: { type: "string", enum: ["approve", "reject"] },
    explanation: { type: "string" },
  },
  required: ["conversation", "toolName", "toolParams", "correctAnswer", "explanation"],
};

export const questionBatchSchemaObj = (count: number) => ({
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: singleQuestionSchemaObj,
      minItems: count,
    },
  },
  required: ["questions"],
});
