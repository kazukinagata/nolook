import type { Category, Difficulty, Language } from "./types.js";

const categoryDescriptions: Record<Category, Record<Language, string>> = {
  destructive: {
    en: "Destructive operations - commands that delete files, reset git history, drop databases, force push, etc. These should generally be REJECTED unless the user explicitly asked for them.",
    ja: "破壊的操作 - ファイル削除、gitリセット、データベースドロップ、フォースプッシュなど。ユーザーが明示的に要求していない限り、拒否すべき。",
    ko: "파괴적 작업 - 파일 삭제, git 리셋, 데이터베이스 드롭, 강제 푸시 등. 사용자가 명시적으로 요청하지 않는 한 거부해야 합니다.",
    zh: "破坏性操作 - 删除文件、git重置、删除数据库、强制推送等。除非用户明确要求，否则应该拒绝。",
  },
  external: {
    en: "External communications - commands that push code, make API calls, send messages, post to external services. These should be REJECTED unless the user explicitly asked for them.",
    ja: "外部通信 - コードプッシュ、API呼び出し、メッセージ送信、外部サービスへのポストなど。ユーザーが明示的に要求していない限り、拒否すべき。",
    ko: "외부 통신 - 코드 푸시, API 호출, 메시지 전송, 외부 서비스에 게시 등. 사용자가 명시적으로 요청하지 않는 한 거부해야 합니다.",
    zh: "外部通信 - 推送代码、API调用、发送消息、发布到外部服务等。除非用户明确要求，否则应该拒绝。",
  },
  privilege: {
    en: "Privilege and authentication - commands using sudo, changing permissions, accessing credentials or .env files, modifying auth configs. These should generally be REJECTED.",
    ja: "権限・認証 - sudo使用、権限変更、認証情報や.envファイルへのアクセス、認証設定の変更など。一般的に拒否すべき。",
    ko: "권한 및 인증 - sudo 사용, 권한 변경, 자격 증명 또는 .env 파일 액세스, 인증 구성 변경 등. 일반적으로 거부해야 합니다.",
    zh: "权限和认证 - 使用sudo、更改权限、访问凭据或.env文件、修改认证配置等。通常应该拒绝。",
  },
  data_modification: {
    en: "Data modification - commands that edit files, write to databases, change configs, install/remove packages. These may be APPROVED if they match what the user asked for, or REJECTED if they go beyond the scope.",
    ja: "データ変更 - ファイル編集、DB書き込み、設定変更、パッケージのインストール/削除など。ユーザーの要求に合致していれば承認、範囲を超えていれば拒否。",
    ko: "데이터 수정 - 파일 편집, DB 쓰기, 설정 변경, 패키지 설치/삭제 등. 사용자의 요청과 일치하면 승인, 범위를 넘으면 거부.",
    zh: "数据修改 - 编辑文件、写入数据库、更改配置、安装/删除包等。如果符合用户要求则批准，超出范围则拒绝。",
  },
  safe: {
    en: "Safe Bash operations - commands like ls, cat, git status, git log, npm test, grep. Note: In Claude Code, Read/Glob/Grep tools are auto-allowed and never show confirmation dialogs. This category uses Bash commands that are safe but still require user confirmation. These should generally be APPROVED. The trick is: don't reject safe commands out of unnecessary caution.",
    ja: "安全なBash操作 - ls、cat、git status、git log、npm test、grepなど。注意：Claude CodeではRead/Glob/Grepツールは自動許可され確認ダイアログが出ない。このカテゴリでは安全だが確認が必要なBashコマンドを使用する。一般的に承認すべき。ポイント：不必要な警戒で安全なコマンドを拒否しないこと。",
    ko: "안전한 Bash 작업 - ls, cat, git status, git log, npm test, grep 등. 참고: Claude Code에서 Read/Glob/Grep 도구는 자동 허용되어 확인 대화상자가 표시되지 않습니다. 일반적으로 승인해야 합니다.",
    zh: "安全的Bash操作 - ls、cat、git status、git log、npm test、grep等。注意：Claude Code中Read/Glob/Grep工具是自动允许的，不会显示确认对话框。通常应该批准。",
  },
};

const difficultyGuidelines: Record<Difficulty, Record<Language, string>> = {
  easy: {
    en: `EASY difficulty: Create an obvious scenario.
- If the correct answer is "reject": use a clearly dangerous command (rm -rf /, DROP TABLE, git push --force to main, etc.)
- If the correct answer is "approve": use a clearly safe command (ls, cat, git log, npm test, etc.)
- The user's request in the conversation should make it very clear whether the tool call is appropriate.`,
    ja: `EASY難易度: 明白なシナリオを作成。
- 正解が「拒否」の場合：明らかに危険なコマンド（rm -rf /、DROP TABLE、git push --force to mainなど）
- 正解が「承認」の場合：明らかに安全なコマンド（ls、cat、git log、npm testなど）
- 会話中のユーザーの要求から、ツールコールが適切かどうかが非常に明確であること。`,
    ko: `EASY 난이도: 명백한 시나리오 생성.
- 정답이 "거부"인 경우: 명확히 위험한 명령 (rm -rf /, DROP TABLE, git push --force to main 등)
- 정답이 "승인"인 경우: 명확히 안전한 명령 (ls, cat, git log, npm test 등)`,
    zh: `EASY难度: 创建明显的场景。
- 如果正确答案是"拒绝"：使用明显危险的命令（rm -rf /、DROP TABLE、git push --force to main等）
- 如果正确答案是"批准"：使用明显安全的命令（ls、cat、git log、npm test等）`,
  },
  medium: {
    en: `MEDIUM difficulty: Create a context-dependent scenario.
- The command itself might look harmless or dangerous, but the USER'S REQUEST determines whether it's appropriate.
- Example: "git push" is fine if the user said "push my changes", but wrong if the user only asked to "commit".
- Example: Editing a file the user didn't ask to modify. Installing an extra package not requested.
- The player needs to READ the conversation context to judge correctly.`,
    ja: `MEDIUM難易度: 文脈依存のシナリオを作成。
- コマンド自体は無害または危険に見えるが、ユーザーの要求が適切かどうかを決定する。
- 例：「変更をプッシュして」と言われた場合の「git push」は適切だが、「コミットして」としか言われていない場合は不適切。
- プレイヤーは会話のコンテキストを読んで正しく判断する必要がある。`,
    ko: `MEDIUM 난이도: 문맥 의존적 시나리오 생성.
- 명령 자체는 무해하거나 위험해 보일 수 있지만, 사용자의 요청이 적절한지를 결정합니다.
- 플레이어는 대화 컨텍스트를 읽고 올바르게 판단해야 합니다.`,
    zh: `MEDIUM难度: 创建上下文相关的场景。
- 命令本身可能看起来无害或危险，但用户的请求决定了它是否合适。
- 玩家需要阅读对话上下文来正确判断。`,
  },
  hard: {
    en: `HARD difficulty: Create a subtly tricky scenario.
- The command looks safe at first glance but has hidden dangers (e.g., "npm install" but it's a typosquatted package name).
- Or the command looks dangerous but is actually what the user asked for (e.g., user explicitly asked to "delete all temp files" and the command does exactly that).
- Edge cases: commands that affect more than expected, side effects not obvious from the command itself, subtle permission issues.
- The player needs deep understanding of both the tools AND the conversation context.`,
    ja: `HARD難易度: 巧妙に紛らわしいシナリオを作成。
- 一見安全だが隠れた危険性がある（例：「npm install」だがタイポスクワッティングされたパッケージ名）。
- または一見危険だが実際にはユーザーが要求したもの（例：ユーザーが明示的に「すべての一時ファイルを削除して」と要求）。
- エッジケース：予想以上に影響するコマンド、コマンド自体からは明らかでない副作用、微妙な権限問題。`,
    ko: `HARD 난이도: 교묘하게 까다로운 시나리오 생성.
- 언뜻 보면 안전해 보이지만 숨겨진 위험이 있는 경우.
- 또는 위험해 보이지만 실제로 사용자가 요청한 것인 경우.`,
    zh: `HARD难度: 创建巧妙的棘手场景。
- 乍看安全但有隐藏危险（如npm install但是拼写近似的恶意包名）。
- 或者看起来危险但实际上是用户要求的。`,
  },
};

export function buildPrompt(
  category: Category,
  difficulty: Difficulty,
  language: Language
): string {
  const langName = { en: "English", ja: "Japanese", ko: "Korean", zh: "Chinese" }[language];

  return `You are generating a quiz question for "NoLook", a game that tests whether users can correctly approve or reject Claude Code tool execution confirmations.

Generate a realistic Claude Code scenario where an AI coding assistant is working on a task and requests permission to execute a tool.

Category: ${categoryDescriptions[category][language]}

${difficultyGuidelines[difficulty][language]}

IMPORTANT RULES:
- The conversation messages must be in ${langName}
- The toolName should be one of: "Bash", "Write", "Edit"
- Do NOT use "Read", "Glob", or "Grep" as toolName — these are auto-allowed in Claude Code and never show a confirmation dialog to the user
- For Bash tools, toolParams should have a "command" field with the shell command
- For Write/Edit tools, toolParams should have a "file_path" field and relevant content fields
- Make the scenario realistic - something that could actually happen during a coding session
- The conversation should be 2-4 messages showing what the user asked and how the assistant responded before requesting the tool
- The explanation MUST be written in ${langName}. Structure it as follows:
  1. First, explain what each part of the command/tool call does (e.g. for "npm version 2.0.0 && sed -i 's/MIT/UNLICENSED/' package.json", explain "npm version 2.0.0" and "sed -i ..." separately)
  2. Then, explain why the correct answer is approve or reject based on what the user originally asked for
  3. If the command contains multiple parts (piped commands, && chains, etc.), explain each part individually
  4. Keep it concise but educational - the reader may not know what these commands do`;
}

export const questionJsonSchema = JSON.stringify({
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
    toolName: {
      type: "string",
      enum: ["Bash", "Write", "Edit"],
    },
    toolParams: { type: "object" },
    correctAnswer: { type: "string", enum: ["approve", "reject"] },
    explanation: {
      type: "string",
      description:
        "Detailed explanation: first explain what each command/tool operation does individually, then explain why it should be approved or rejected based on the user's request",
    },
  },
  required: [
    "conversation",
    "toolName",
    "toolParams",
    "correctAnswer",
    "explanation",
  ],
});
