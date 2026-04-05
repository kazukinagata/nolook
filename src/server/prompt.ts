import type { Category, Difficulty, Language } from "./types.js";

const categoryDescriptions: Record<Category, Record<Language, string>> = {
  destructive: {
    en: "Destructive operations - commands that delete files, overwrite files with cp/mv without backup, reset git history, drop databases, force push, recursive tar extraction overwriting existing files, find -exec rm, etc. These should generally be REJECTED unless the user explicitly asked for them.",
    ja: "破壊的操作 - ファイル削除、cp/mvでバックアップなしの上書き、gitリセット、データベースドロップ、フォースプッシュ、tar展開による既存ファイル上書き、find -exec rmなど。ユーザーが明示的に要求していない限り、拒否すべき。",
    ko: "파괴적 작업 - 파일 삭제, cp/mv로 백업 없이 덮어쓰기, git 리셋, 데이터베이스 드롭, 강제 푸시, tar 추출로 기존 파일 덮어쓰기, find -exec rm 등. 사용자가 명시적으로 요청하지 않는 한 거부해야 합니다.",
    zh: "破坏性操作 - 删除文件、cp/mv无备份覆盖、git重置、删除数据库、强制推送、tar解压覆盖现有文件、find -exec rm等。除非用户明确要求，否则应该拒绝。",
  },
  external: {
    en: "External communications - commands that push code, make API calls, send messages, post to external services, scp/rsync files to remote servers, upload archives via curl. These should be REJECTED unless the user explicitly asked for them.",
    ja: "外部通信 - コードプッシュ、API呼び出し、メッセージ送信、外部サービスへのポスト、scp/rsyncでリモートサーバーへファイル転送、curlでアップロードなど。ユーザーが明示的に要求していない限り、拒否すべき。",
    ko: "외부 통신 - 코드 푸시, API 호출, 메시지 전송, 외부 서비스에 게시, scp/rsync로 원격 서버에 파일 전송, curl로 업로드 등. 사용자가 명시적으로 요청하지 않는 한 거부해야 합니다.",
    zh: "外部通信 - 推送代码、API调用、发送消息、发布到外部服务、scp/rsync传输文件到远程服务器、curl上传等。除非用户明确要求，否则应该拒绝。",
  },
  privilege: {
    en: "Privilege and authentication - commands using sudo, changing permissions with chmod/chown, changing file ownership, accessing credentials or .env files, modifying auth configs. These should generally be REJECTED.",
    ja: "権限・認証 - sudo使用、chmod/chownによる権限変更、ファイル所有権変更、認証情報や.envファイルへのアクセス、認証設定の変更など。一般的に拒否すべき。",
    ko: "권한 및 인증 - sudo 사용, chmod/chown으로 권한 변경, 파일 소유권 변경, 자격 증명 또는 .env 파일 액세스, 인증 구성 변경 등. 일반적으로 거부해야 합니다.",
    zh: "权限和认证 - 使用sudo、chmod/chown更改权限、更改文件所有权、访问凭据或.env文件、修改认证配置等。通常应该拒绝。",
  },
  data_modification: {
    en: "Data modification - commands that edit files, write to databases, change configs, install/remove packages, copy/move/rename files with cp/mv, create directories with mkdir, create symlinks with ln, modify files with sed/awk, create/extract archives with tar/zip. These may be APPROVED if they match what the user asked for, or REJECTED if they go beyond the scope.",
    ja: "データ変更 - ファイル編集、DB書き込み、設定変更、パッケージのインストール/削除、cp/mvによるファイルのコピー/移動/リネーム、mkdirでのディレクトリ作成、lnでのシンボリックリンク作成、sed/awkでのファイル編集、tar/zipでのアーカイブ作成/展開など。ユーザーの要求に合致していれば承認、範囲を超えていれば拒否。",
    ko: "데이터 수정 - 파일 편집, DB 쓰기, 설정 변경, 패키지 설치/삭제, cp/mv로 파일 복사/이동/이름 변경, mkdir로 디렉토리 생성, ln으로 심볼릭 링크 생성, sed/awk로 파일 편집, tar/zip으로 아카이브 생성/추출 등. 사용자의 요청과 일치하면 승인, 범위를 넘으면 거부.",
    zh: "数据修改 - 编辑文件、写入数据库、更改配置、安装/删除包、cp/mv复制/移动/重命名文件、mkdir创建目录、ln创建符号链接、sed/awk编辑文件、tar/zip创建/解压归档等。如果符合用户要求则批准，超出范围则拒绝。",
  },
  safe: {
    en: "Safe Bash operations - commands like ls, cat, git status, git log, npm test, grep, diff, head, tail, file, stat, wc, du, find (read-only). Note: In Claude Code, Read/Glob/Grep tools are auto-allowed and never show confirmation dialogs. This category uses Bash commands that are safe but still require user confirmation. These should generally be APPROVED. The trick is: don't reject safe commands out of unnecessary caution.",
    ja: "安全なBash操作 - ls、cat、git status、git log、npm test、grep、diff、head、tail、file、stat、wc、du、find（読み取り専用）など。注意：Claude CodeではRead/Glob/Grepツールは自動許可され確認ダイアログが出ない。このカテゴリでは安全だが確認が必要なBashコマンドを使用する。一般的に承認すべき。ポイント：不必要な警戒で安全なコマンドを拒否しないこと。",
    ko: "안전한 Bash 작업 - ls, cat, git status, git log, npm test, grep, diff, head, tail, file, stat, wc, du, find(읽기 전용) 등. 참고: Claude Code에서 Read/Glob/Grep 도구는 자동 허용되어 확인 대화상자가 표시되지 않습니다. 일반적으로 승인해야 합니다.",
    zh: "安全的Bash操作 - ls、cat、git status、git log、npm test、grep、diff、head、tail、file、stat、wc、du、find（只读）等。注意：Claude Code中Read/Glob/Grep工具是自动允许的，不会显示确认对话框。通常应该批准。",
  },
};

const difficultyGuidelines: Record<Difficulty, Record<Language, string>> = {
  easy: {
    en: `EASY difficulty: Create an obvious scenario.
- If the correct answer is "reject": use a clearly dangerous command (rm -rf /, DROP TABLE, git push --force to main, cp /dev/null important-file, mv critical-config /dev/null, etc.)
- If the correct answer is "approve": use a clearly safe command (ls, cat, git log, npm test, diff file1 file2, head -20 log.txt, tail -f server.log, etc.)
- The user's request in the conversation should make it very clear whether the tool call is appropriate.`,
    ja: `EASY難易度: 明白なシナリオを作成。
- 正解が「拒否」の場合：明らかに危険なコマンド（rm -rf /、DROP TABLE、git push --force to main、cp /dev/null 重要ファイル、mv 設定ファイル /dev/nullなど）
- 正解が「承認」の場合：明らかに安全なコマンド（ls、cat、git log、npm test、diff file1 file2、head -20 log.txt、tail -f server.logなど）
- 会話中のユーザーの要求から、ツールコールが適切かどうかが非常に明確であること。`,
    ko: `EASY 난이도: 명백한 시나리오 생성.
- 정답이 "거부"인 경우: 명확히 위험한 명령 (rm -rf /, DROP TABLE, git push --force to main, cp /dev/null 중요파일 등)
- 정답이 "승인"인 경우: 명확히 안전한 명령 (ls, cat, git log, npm test, diff, head, tail 등)`,
    zh: `EASY难度: 创建明显的场景。
- 如果正确答案是"拒绝"：使用明显危险的命令（rm -rf /、DROP TABLE、git push --force to main、cp /dev/null 重要文件等）
- 如果正确答案是"批准"：使用明显安全的命令（ls、cat、git log、npm test、diff、head、tail等）`,
  },
  medium: {
    en: `MEDIUM difficulty: Create a context-dependent scenario.
- The command itself might look harmless or dangerous, but the USER'S REQUEST determines whether it's appropriate.
- Example: "git push" is fine if the user said "push my changes", but wrong if the user only asked to "commit".
- Example: Editing a file the user didn't ask to modify. Installing an extra package not requested.
- Example: "sed -i 's/foo/bar/g' config.json" is fine if the user asked for the replacement, but wrong if it modifies more files than requested.
- Example: "mv file.ts newfile.ts" when user asked to "copy" — should use cp instead.
- Example: Pipeline like "find . -name '*.ts' | xargs sed -i ..." — check if the scope matches what the user asked.
- The player needs to READ the conversation context to judge correctly.`,
    ja: `MEDIUM難易度: 文脈依存のシナリオを作成。
- コマンド自体は無害または危険に見えるが、ユーザーの要求が適切かどうかを決定する。
- 例：「変更をプッシュして」と言われた場合の「git push」は適切だが、「コミットして」としか言われていない場合は不適切。
- 例：「sed -i 's/foo/bar/g' config.json」はユーザーが依頼した置換なら適切だが、要求以上のファイルを変更していれば不適切。
- 例：ユーザーが「コピーして」と言ったのにmvを使う場合 — cpを使うべき。
- 例：「find . -name '*.ts' | xargs sed -i ...」のようなパイプライン — スコープがユーザーの要求と一致するか確認。
- プレイヤーは会話のコンテキストを読んで正しく判断する必要がある。`,
    ko: `MEDIUM 난이도: 문맥 의존적 시나리오 생성.
- 명령 자체는 무해하거나 위험해 보일 수 있지만, 사용자의 요청이 적절한지를 결정합니다.
- 예: sed -i로 파일 편집은 요청과 일치하면 적절하지만, 범위를 초과하면 부적절합니다.
- 예: "find | xargs sed" 같은 파이프라인 — 범위가 요청과 일치하는지 확인.
- 플레이어는 대화 컨텍스트를 읽고 올바르게 판단해야 합니다.`,
    zh: `MEDIUM难度: 创建上下文相关的场景。
- 命令本身可能看起来无害或危险，但用户的请求决定了它是否合适。
- 例: sed -i编辑文件在符合请求时是适当的，但超出范围则不适当。
- 例: "find | xargs sed"等管道命令 — 检查范围是否与请求匹配。
- 玩家需要阅读对话上下文来正确判断。`,
  },
  hard: {
    en: `HARD difficulty: Create a subtly tricky scenario.
- The command looks safe at first glance but has hidden dangers (e.g., "npm install" but it's a typosquatted package name).
- Or the command looks dangerous but is actually what the user asked for (e.g., user explicitly asked to "delete all temp files" and the command does exactly that).
- Edge cases: commands that affect more than expected, side effects not obvious from the command itself, subtle permission issues.
- Example: "sed -i 's/http/https/g'" turns existing 'https' into 'httpss' — a subtle regex bug.
- Example: "rsync --delete" syncs files but also deletes anything not in source — a hidden destructive flag.
- Example: "find -print0 | xargs -0 sed -i ..." — a multi-stage pipeline that may be correct or may silently modify too many files.
- The player needs deep understanding of both the tools AND the conversation context.`,
    ja: `HARD難易度: 巧妙に紛らわしいシナリオを作成。
- 一見安全だが隠れた危険性がある（例：「npm install」だがタイポスクワッティングされたパッケージ名）。
- または一見危険だが実際にはユーザーが要求したもの（例：ユーザーが明示的に「すべての一時ファイルを削除して」と要求）。
- エッジケース：予想以上に影響するコマンド、コマンド自体からは明らかでない副作用、微妙な権限問題。
- 例：「sed -i 's/http/https/g'」は既存の'https'を'httpss'に変えてしまう — 微妙な正規表現バグ。
- 例：「rsync --delete」はファイル同期だがソースにないファイルを削除する — 隠れた破壊的フラグ。
- 例：「find -print0 | xargs -0 sed -i ...」— 多段パイプラインが正しいか、サイレントに多くのファイルを変更していないか。`,
    ko: `HARD 난이도: 교묘하게 까다로운 시나리오 생성.
- 언뜻 보면 안전해 보이지만 숨겨진 위험이 있는 경우.
- 또는 위험해 보이지만 실제로 사용자가 요청한 것인 경우.
- 예: "sed -i 's/http/https/g'"는 기존 'https'를 'httpss'로 바꾸는 미묘한 정규식 버그.
- 예: "rsync --delete"는 소스에 없는 파일을 삭제하는 숨겨진 파괴적 플래그.
- 예: "find -print0 | xargs -0 sed -i ..." — 다단계 파이프라인의 범위 확인.`,
    zh: `HARD难度: 创建巧妙的棘手场景。
- 乍看安全但有隐藏危险（如npm install但是拼写近似的恶意包名）。
- 或者看起来危险但实际上是用户要求的。
- 例: "sed -i 's/http/https/g'"会把现有的'https'变成'httpss' — 微妙的正则表达式错误。
- 例: "rsync --delete"会删除源中不存在的文件 — 隐藏的破坏性标志。
- 例: "find -print0 | xargs -0 sed -i ..." — 多阶段管道的范围检查。`,
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
  4. Keep it concise but educational - the reader may not know what these commands do
- Do NOT create ambiguous scenarios where the correct answer is debatable. The user's intent and best practices must both point to the same answer. Avoid cases where the tool call fulfills the user's request but violates best practices (e.g., user says "push して" and the tool runs "git push origin main" — the request is fulfilled but pushing to main directly is questionable). Similarly, avoid cases where the tool follows best practices but ignores what the user actually asked for. The player should be able to arrive at one clear answer.`;
}

export function buildBatchPrompt(
  specs: Array<{ category: Category; difficulty: Difficulty }>,
  language: Language
): string {
  const langName = { en: "English", ja: "Japanese", ko: "Korean", zh: "Chinese" }[language];

  const questionSpecs = specs
    .map(
      (s, i) =>
        `Question ${i + 1}: Category="${s.category}" (${categoryDescriptions[s.category][language]}), ${difficultyGuidelines[s.difficulty][language]}`
    )
    .join("\n\n");

  return `You are generating ${specs.length} quiz questions for "NoLook", a game that tests whether users can correctly approve or reject Claude Code tool execution confirmations.

Generate ${specs.length} realistic Claude Code scenarios where an AI coding assistant is working on a task and requests permission to execute a tool.

Each question has its own category and difficulty:

${questionSpecs}

IMPORTANT RULES (apply to ALL questions):
- The conversation messages must be in ${langName}
- The toolName should be one of: "Bash", "Write", "Edit"
- Do NOT use "Read", "Glob", or "Grep" as toolName — these are auto-allowed in Claude Code and never show a confirmation dialog to the user
- For Bash tools, toolParams should have a "command" field with the shell command
- For Write/Edit tools, toolParams should have a "file_path" field and relevant content fields
- Make each scenario realistic - something that could actually happen during a coding session
- Each conversation should be 2-4 messages showing what the user asked and how the assistant responded before requesting the tool
- Each explanation MUST be written in ${langName}. Structure it as follows:
  1. First, explain what each part of the command/tool call does
  2. Then, explain why the correct answer is approve or reject based on what the user originally asked for
  3. If the command contains multiple parts, explain each part individually
  4. Keep it concise but educational
- Do NOT create ambiguous scenarios where the correct answer is debatable. The user's intent and best practices must both point to the same answer. Avoid cases where the tool call fulfills the user's request but violates best practices (e.g., user says "push して" and the tool runs "git push origin main" — the request is fulfilled but pushing to main directly is questionable). Similarly, avoid cases where the tool follows best practices but ignores what the user actually asked for. The player should be able to arrive at one clear answer.
- Each question MUST be unique — different scenarios, different commands, different conversation contexts`;
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
};

export const questionJsonSchema = JSON.stringify(singleQuestionSchemaObj);

export const questionBatchJsonSchema = (count: number) =>
  JSON.stringify({
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: singleQuestionSchemaObj,
        minItems: count,
        maxItems: count,
      },
    },
    required: ["questions"],
  });
