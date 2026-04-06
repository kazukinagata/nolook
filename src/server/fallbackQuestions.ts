import type { Category, Difficulty, Language, QuestionWithAnswer } from "./types.js";
import { TIME_LIMIT_MS } from "./types.js";

interface StaticQuestion {
  category: Category;
  difficulty: Difficulty;
  conversation: { role: "user" | "assistant"; content: string }[];
  toolName: string;
  toolParams: Record<string, unknown>;
  correctAnswer: "approve" | "reject";
  explanation: string;
}

// === English Static Questions (30) ===
const enQuestions: StaticQuestion[] = [
  // --- DESTRUCTIVE (6) ---
  {
    category: "destructive",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Clean up the build artifacts" },
      { role: "assistant", content: "I'll clean up the build artifacts for you." },
    ],
    toolName: "Bash",
    toolParams: { command: "rm -rf / --no-preserve-root" },
    correctAnswer: "reject",
    explanation: "This command would delete the entire filesystem, not just build artifacts. This is catastrophically destructive.",
  },
  {
    category: "destructive",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Remove the dist folder" },
      { role: "assistant", content: "I'll remove the dist directory." },
    ],
    toolName: "Bash",
    toolParams: { command: "rm -rf dist/" },
    correctAnswer: "approve",
    explanation: "The user explicitly asked to remove the dist folder, and the command targets only that directory.",
  },
  {
    category: "destructive",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Undo my last commit, I made a mistake" },
      { role: "assistant", content: "I'll reset to undo your last commit." },
    ],
    toolName: "Bash",
    toolParams: { command: "git reset --hard HEAD~1" },
    correctAnswer: "reject",
    explanation: "git reset --hard discards all changes. A safer alternative like 'git reset --soft HEAD~1' would preserve the changes.",
  },
  {
    category: "destructive",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Extract the backup archive into the data directory" },
      { role: "assistant", content: "I'll extract the archive to the data directory." },
    ],
    toolName: "Bash",
    toolParams: { command: "tar -xzf backup.tar.gz -C /" },
    correctAnswer: "reject",
    explanation: "The user asked to extract to the data directory, but the command extracts to root (/) with -C /. This could overwrite system files.",
  },
  {
    category: "destructive",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Delete all the log files from the project" },
      { role: "assistant", content: "I'll find and remove all .log files in the project." },
    ],
    toolName: "Bash",
    toolParams: { command: "find . -name '*.log' -delete" },
    correctAnswer: "approve",
    explanation: "The user explicitly asked to delete all log files, and the command correctly targets only .log files within the current directory.",
  },
  {
    category: "destructive",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Replace all occurrences of 'http' with 'https' in the config files" },
      { role: "assistant", content: "I'll update the URLs in the config files." },
    ],
    toolName: "Bash",
    toolParams: { command: "find . -name '*.conf' -exec sed -i 's/http/https/g' {} +" },
    correctAnswer: "reject",
    explanation: "This find + sed pipeline has a subtle regex bug: 's/http/https/g' would turn existing 'https' into 'httpss'. The correct pattern should be 's|http://|https://|g'.",
  },
  // --- EXTERNAL (6) ---
  {
    category: "external",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Commit my changes" },
      { role: "assistant", content: "I'll commit and push your changes." },
    ],
    toolName: "Bash",
    toolParams: { command: "git add -A && git commit -m 'Update code' && git push origin main" },
    correctAnswer: "reject",
    explanation: "The user only asked to commit, not push. Pushing to remote goes beyond the requested scope.",
  },
  {
    category: "external",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Fetch the latest changes from origin" },
      { role: "assistant", content: "I'll fetch the latest changes." },
    ],
    toolName: "Bash",
    toolParams: { command: "git fetch origin" },
    correctAnswer: "approve",
    explanation: "git fetch only downloads changes without modifying the working tree. This matches what the user asked for.",
  },
  {
    category: "external",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Create a PR for my changes" },
      { role: "assistant", content: "I'll create a pull request for your current branch." },
    ],
    toolName: "Bash",
    toolParams: { command: "gh pr create --title 'Feature update' --body 'Updated feature implementation'" },
    correctAnswer: "approve",
    explanation: "The user explicitly asked to create a PR, and gh pr create is the appropriate command for that.",
  },
  {
    category: "external",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Copy the logs to the shared drive for analysis" },
      { role: "assistant", content: "I'll copy the logs to the shared drive." },
    ],
    toolName: "Bash",
    toolParams: {
      command: "scp -r logs/ admin@fileserver.corp.net:/shared/logs/ && curl -X POST https://hooks.slack.com/services/T00/B00/xxx -d '{\"text\": \"Logs uploaded\"}'",
    },
    correctAnswer: "reject",
    explanation: "The user only asked to copy logs. The command also sends a Slack notification via curl, which is external communication that was not requested.",
  },
  {
    category: "external",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Check the status of the CI pipeline" },
      { role: "assistant", content: "I'll check the CI pipeline status. Let me also post an update to the team." },
    ],
    toolName: "Bash",
    toolParams: {
      command: "gh run list --limit 5 && curl -X POST https://hooks.slack.com/services/T00/B00/xxx -d '{\"text\": \"CI status checked\"}'",
    },
    correctAnswer: "reject",
    explanation: "The user only asked to check CI status. The command also sends a Slack message, which was not requested.",
  },
  {
    category: "external",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Sync the documentation folder to the backup server" },
      { role: "assistant", content: "I'll sync the docs to the backup server." },
    ],
    toolName: "Bash",
    toolParams: { command: "rsync -avz --delete docs/ backup@server:/var/docs/" },
    correctAnswer: "reject",
    explanation: "The --delete flag causes rsync to delete files on the destination that don't exist in the source. The user asked to sync, not mirror with deletion.",
  },
  // --- PRIVILEGE (6) ---
  {
    category: "privilege",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Install the project dependencies" },
      { role: "assistant", content: "I'll install the dependencies with elevated permissions." },
    ],
    toolName: "Bash",
    toolParams: { command: "sudo npm install" },
    correctAnswer: "reject",
    explanation: "npm install should never require sudo. Using sudo with npm is a security risk and can cause permission issues.",
  },
  {
    category: "privilege",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Change the owner of the project files to my user" },
      { role: "assistant", content: "I'll change file ownership." },
    ],
    toolName: "Bash",
    toolParams: { command: "sudo chown -R root:root /home/user/project/" },
    correctAnswer: "reject",
    explanation: "The user asked to change ownership to their user, but the command changes to root. This would lock the user out.",
  },
  {
    category: "privilege",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Check what environment variables are set for the app" },
      { role: "assistant", content: "I'll check the environment configuration." },
    ],
    toolName: "Bash",
    toolParams: { command: "cat .env" },
    correctAnswer: "reject",
    explanation: ".env files typically contain secrets (API keys, passwords). Reading them exposes sensitive credentials.",
  },
  {
    category: "privilege",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Make all shell scripts in the project executable" },
      { role: "assistant", content: "I'll update the permissions on the shell scripts." },
    ],
    toolName: "Bash",
    toolParams: { command: "find . -name '*.sh' | xargs chmod 777" },
    correctAnswer: "reject",
    explanation: "chmod 777 sets read/write/execute for everyone, which is a security risk. chmod +x or chmod 755 would be appropriate.",
  },
  {
    category: "privilege",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Fix the file permission issue on the deploy script" },
      { role: "assistant", content: "I'll fix the permissions so the deploy script is executable." },
    ],
    toolName: "Bash",
    toolParams: { command: "chmod +x scripts/deploy.sh" },
    correctAnswer: "approve",
    explanation: "The user asked to fix permission issues on a deploy script. chmod +x to make a script executable is standard and safe.",
  },
  {
    category: "privilege",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Show me the SSH config" },
      { role: "assistant", content: "I'll read your SSH configuration." },
    ],
    toolName: "Bash",
    toolParams: { command: "cat ~/.ssh/id_rsa" },
    correctAnswer: "reject",
    explanation: "The user asked for SSH config, but the command reads the private key (~/.ssh/id_rsa) instead of the config file (~/.ssh/config).",
  },
  // --- DATA_MODIFICATION (6) ---
  {
    category: "data_modification",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Add a new utility function to format dates" },
      { role: "assistant", content: "I'll create a date formatting utility in src/utils/date.ts." },
    ],
    toolName: "Write",
    toolParams: {
      file_path: "src/utils/date.ts",
      content: 'export function formatDate(date: Date): string {\n  return date.toISOString().split("T")[0];\n}\n',
    },
    correctAnswer: "approve",
    explanation: "The user asked for a new utility function, and the assistant is creating exactly that in an appropriate location.",
  },
  {
    category: "data_modification",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Create the directory structure for the new feature module" },
      { role: "assistant", content: "I'll create the directory structure." },
    ],
    toolName: "Bash",
    toolParams: { command: "mkdir -p src/features/auth/{components,hooks,utils}" },
    correctAnswer: "approve",
    explanation: "The user asked to create a directory structure. mkdir -p creates directories including parents. This doesn't affect existing files.",
  },
  {
    category: "data_modification",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Fix the typo in the README" },
      { role: "assistant", content: "I'll fix the typo and also restructure the README sections." },
    ],
    toolName: "Write",
    toolParams: {
      file_path: "README.md",
      content: "# Project\n\nCompletely rewritten README content...\n",
    },
    correctAnswer: "reject",
    explanation: "The user only asked to fix a typo, but the assistant is completely rewriting the README. This goes far beyond the requested scope.",
  },
  {
    category: "data_modification",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Rename the old API file to match the new naming convention" },
      { role: "assistant", content: "I'll rename the file and update related imports." },
    ],
    toolName: "Bash",
    toolParams: { command: "mv src/api/oldApi.ts src/api/newApi.ts && sed -i 's/oldApi/newApi/g' src/**/*.ts" },
    correctAnswer: "reject",
    explanation: "The user only asked to rename the file. The command also modifies import statements across all TypeScript files, going beyond scope.",
  },
  {
    category: "data_modification",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Update the database migration to add the email column" },
      { role: "assistant", content: "I'll update the migration file to add the email column to the users table." },
    ],
    toolName: "Write",
    toolParams: {
      file_path: "migrations/003_add_email.sql",
      content: "ALTER TABLE users ADD COLUMN email VARCHAR(255);\nALTER TABLE users DROP COLUMN legacy_auth;",
    },
    correctAnswer: "reject",
    explanation: "The user asked to add an email column, but the migration also drops the legacy_auth column which was not requested.",
  },
  {
    category: "data_modification",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Replace all console.log calls with logger.info across the TypeScript source files" },
      { role: "assistant", content: "I'll replace console.log with logger.info in all TypeScript files." },
    ],
    toolName: "Bash",
    toolParams: { command: "find src -name '*.ts' -print0 | xargs -0 sed -i 's/console\\.log/logger.info/g'" },
    correctAnswer: "approve",
    explanation: "The user explicitly asked to replace console.log with logger.info across all TypeScript files. The pipeline does exactly that.",
  },
  // --- SAFE (6) ---
  {
    category: "safe",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Show me the project structure" },
      { role: "assistant", content: "I'll list the files in the project." },
    ],
    toolName: "Bash",
    toolParams: { command: "ls -la" },
    correctAnswer: "approve",
    explanation: "ls -la is a read-only command that simply lists files. This is completely safe to execute.",
  },
  {
    category: "safe",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Show me the last 50 lines of the server log" },
      { role: "assistant", content: "I'll show the recent log entries." },
    ],
    toolName: "Bash",
    toolParams: { command: "tail -50 logs/server.log" },
    correctAnswer: "approve",
    explanation: "tail is a read-only command that shows the end of a file. It doesn't modify anything.",
  },
  {
    category: "safe",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Find all TODO comments in the codebase" },
      { role: "assistant", content: "I'll search for TODO comments across the project." },
    ],
    toolName: "Bash",
    toolParams: { command: "grep -rn 'TODO' src/" },
    correctAnswer: "approve",
    explanation: "grep is a read-only search command. Searching for TODO comments is a safe operation.",
  },
  {
    category: "safe",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Find all TypeScript files that contain deprecated API calls" },
      { role: "assistant", content: "I'll search for deprecated API usage across the TypeScript files." },
    ],
    toolName: "Bash",
    toolParams: { command: "find src -name '*.ts' | xargs grep -l 'deprecated' | sort" },
    correctAnswer: "approve",
    explanation: "This find | xargs grep | sort pipeline is entirely read-only. Nothing is modified.",
  },
  {
    category: "safe",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Check if there are any large files that shouldn't be in the repo" },
      { role: "assistant", content: "I'll check for large files in the repository." },
    ],
    toolName: "Bash",
    toolParams: { command: "find . -type f -size +10M -not -path './.git/*' | head -20" },
    correctAnswer: "approve",
    explanation: "This find command is read-only - it only lists files larger than 10MB. It doesn't modify or delete anything.",
  },
  {
    category: "safe",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Check how much disk space the old log files are using" },
      { role: "assistant", content: "I'll check the total size of log files older than 30 days." },
    ],
    toolName: "Bash",
    toolParams: { command: "find . -name '*.log' -mtime +30 -print0 | xargs -0 du -ch | tail -1" },
    correctAnswer: "approve",
    explanation: "This pipeline is entirely read-only: find locates old log files, du calculates size, tail shows total. No files are modified.",
  },
];

// === Japanese Static Questions (30) ===
const jaQuestions: StaticQuestion[] = [
  // --- DESTRUCTIVE (6) ---
  {
    category: "destructive",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "ビルド成果物をクリーンアップして" },
      { role: "assistant", content: "ビルド成果物をクリーンアップしますね。" },
    ],
    toolName: "Bash",
    toolParams: { command: "rm -rf / --no-preserve-root" },
    correctAnswer: "reject",
    explanation: "このコマンドはビルド成果物だけでなく、ファイルシステム全体を削除します。壊滅的に危険です。",
  },
  {
    category: "destructive",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "distフォルダを削除して" },
      { role: "assistant", content: "distディレクトリを削除します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "rm -rf dist/" },
    correctAnswer: "approve",
    explanation: "ユーザーが明示的にdistフォルダの削除を依頼しており、コマンドはそのディレクトリのみを対象としています。",
  },
  {
    category: "destructive",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "最後のコミットを取り消して、間違えた" },
      { role: "assistant", content: "リセットして最後のコミットを取り消しますね。" },
    ],
    toolName: "Bash",
    toolParams: { command: "git reset --hard HEAD~1" },
    correctAnswer: "reject",
    explanation: "git reset --hard はすべての変更を破棄します。'git reset --soft HEAD~1' なら変更を保持したまま取り消せます。",
  },
  {
    category: "destructive",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "バックアップアーカイブをdataディレクトリに展開して" },
      { role: "assistant", content: "アーカイブをdataディレクトリに展開します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "tar -xzf backup.tar.gz -C /" },
    correctAnswer: "reject",
    explanation: "ユーザーはdataディレクトリへの展開を依頼しましたが、-C / でルートに展開しています。システムファイルを上書きする可能性があります。",
  },
  {
    category: "destructive",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "プロジェクトからすべてのログファイルを削除して" },
      { role: "assistant", content: ".logファイルを検索して削除しますね。" },
    ],
    toolName: "Bash",
    toolParams: { command: "find . -name '*.log' -delete" },
    correctAnswer: "approve",
    explanation: "ユーザーが明示的にすべてのログファイルの削除を依頼しており、コマンドはカレントディレクトリ内の.logファイルのみを対象としています。",
  },
  {
    category: "destructive",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "設定ファイル内のすべての 'http' を 'https' に置換して" },
      { role: "assistant", content: "設定ファイルのURLを更新します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "find . -name '*.conf' -exec sed -i 's/http/https/g' {} +" },
    correctAnswer: "reject",
    explanation: "'s/http/https/g' は既存の 'https' を 'httpss' に変えてしまう正規表現バグがあります。正しくは 's|http://|https://|g' とすべきです。",
  },
  // --- EXTERNAL (6) ---
  {
    category: "external",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "変更をコミットして" },
      { role: "assistant", content: "変更をコミットしてプッシュしますね。" },
    ],
    toolName: "Bash",
    toolParams: { command: "git add -A && git commit -m 'Update code' && git push origin main" },
    correctAnswer: "reject",
    explanation: "ユーザーはコミットのみ依頼しましたが、プッシュまで行っています。リモートへのプッシュは要求範囲を超えています。",
  },
  {
    category: "external",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "originから最新の変更を取得して" },
      { role: "assistant", content: "最新の変更を取得します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "git fetch origin" },
    correctAnswer: "approve",
    explanation: "git fetch はワーキングツリーを変更せず変更をダウンロードするだけです。ユーザーの依頼通りです。",
  },
  {
    category: "external",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "変更のPRを作って" },
      { role: "assistant", content: "現在のブランチでプルリクエストを作成します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "gh pr create --title 'Feature update' --body 'Updated feature implementation'" },
    correctAnswer: "approve",
    explanation: "ユーザーが明示的にPR作成を依頼しており、gh pr create は適切なコマンドです。",
  },
  {
    category: "external",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "ログを共有ドライブにコピーして分析用に使いたい" },
      { role: "assistant", content: "ログを共有ドライブにコピーします。" },
    ],
    toolName: "Bash",
    toolParams: {
      command: "scp -r logs/ admin@fileserver.corp.net:/shared/logs/ && curl -X POST https://hooks.slack.com/services/T00/B00/xxx -d '{\"text\": \"Logs uploaded\"}'",
    },
    correctAnswer: "reject",
    explanation: "ユーザーはログのコピーのみ依頼しましたが、curlでSlack通知も送信しています。要求されていない外部通信です。",
  },
  {
    category: "external",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "CIパイプラインの状態を確認して" },
      { role: "assistant", content: "CIパイプラインの状態を確認します。チームにも状況を共有しますね。" },
    ],
    toolName: "Bash",
    toolParams: {
      command: "gh run list --limit 5 && curl -X POST https://hooks.slack.com/services/T00/B00/xxx -d '{\"text\": \"CI status checked\"}'",
    },
    correctAnswer: "reject",
    explanation: "ユーザーはCI状態の確認のみ依頼しましたが、Slackメッセージの送信も含まれています。要求されていない外部通信です。",
  },
  {
    category: "external",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "ドキュメントフォルダをバックアップサーバーに同期して" },
      { role: "assistant", content: "ドキュメントをバックアップサーバーに同期します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "rsync -avz --delete docs/ backup@server:/var/docs/" },
    correctAnswer: "reject",
    explanation: "--delete フラグにより、ソースに存在しないファイルがリモートから削除されます。同期（コピー）の依頼であり、ミラーリングではありません。",
  },
  // --- PRIVILEGE (6) ---
  {
    category: "privilege",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "プロジェクトの依存関係をインストールして" },
      { role: "assistant", content: "管理者権限で依存関係をインストールします。" },
    ],
    toolName: "Bash",
    toolParams: { command: "sudo npm install" },
    correctAnswer: "reject",
    explanation: "npm install にsudoは不要です。sudoでnpmを実行するとセキュリティリスクとパーミッション問題の原因になります。",
  },
  {
    category: "privilege",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "プロジェクトファイルの所有者を自分のユーザーに変更して" },
      { role: "assistant", content: "ファイルの所有権を変更します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "sudo chown -R root:root /home/user/project/" },
    correctAnswer: "reject",
    explanation: "ユーザーは自分のユーザーへの変更を依頼しましたが、rootに変更しています。ユーザー自身がファイルにアクセスできなくなります。",
  },
  {
    category: "privilege",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "アプリに設定されている環境変数を確認して" },
      { role: "assistant", content: "環境設定を確認します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "cat .env" },
    correctAnswer: "reject",
    explanation: ".envファイルにはAPIキーやパスワードなどの秘密情報が含まれています。内容の表示はセキュリティリスクです。",
  },
  {
    category: "privilege",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "プロジェクト内のすべてのシェルスクリプトを実行可能にして" },
      { role: "assistant", content: "シェルスクリプトのパーミッションを更新します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "find . -name '*.sh' | xargs chmod 777" },
    correctAnswer: "reject",
    explanation: "chmod 777 は全員に読み書き実行権限を与えるためセキュリティリスクです。chmod +x または chmod 755 が適切です。",
  },
  {
    category: "privilege",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "デプロイスクリプトのパーミッションの問題を修正して" },
      { role: "assistant", content: "デプロイスクリプトを実行可能にします。" },
    ],
    toolName: "Bash",
    toolParams: { command: "chmod +x scripts/deploy.sh" },
    correctAnswer: "approve",
    explanation: "ユーザーがデプロイスクリプトのパーミッション修正を依頼しています。chmod +x でスクリプトを実行可能にするのは標準的で安全な操作です。",
  },
  {
    category: "privilege",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "SSH設定を見せて" },
      { role: "assistant", content: "SSH設定を読み取ります。" },
    ],
    toolName: "Bash",
    toolParams: { command: "cat ~/.ssh/id_rsa" },
    correctAnswer: "reject",
    explanation: "ユーザーはSSH設定を依頼しましたが、コマンドは設定ファイル（~/.ssh/config）ではなく秘密鍵（~/.ssh/id_rsa）を読み取っています。",
  },
  // --- DATA_MODIFICATION (6) ---
  {
    category: "data_modification",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "日付フォーマット用のユーティリティ関数を追加して" },
      { role: "assistant", content: "src/utils/date.ts に日付フォーマットユーティリティを作成します。" },
    ],
    toolName: "Write",
    toolParams: {
      file_path: "src/utils/date.ts",
      content: 'export function formatDate(date: Date): string {\n  return date.toISOString().split("T")[0];\n}\n',
    },
    correctAnswer: "approve",
    explanation: "ユーザーが新しいユーティリティ関数を依頼しており、適切な場所に正確にそれを作成しています。",
  },
  {
    category: "data_modification",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "新機能モジュールのディレクトリ構造を作って" },
      { role: "assistant", content: "ディレクトリ構造を作成します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "mkdir -p src/features/auth/{components,hooks,utils}" },
    correctAnswer: "approve",
    explanation: "ユーザーがディレクトリ構造の作成を依頼しています。mkdir -p は親ディレクトリも含めて作成します。既存ファイルには影響しません。",
  },
  {
    category: "data_modification",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "READMEのタイポを修正して" },
      { role: "assistant", content: "タイポを修正し、READMEのセクション構成も改善しますね。" },
    ],
    toolName: "Write",
    toolParams: {
      file_path: "README.md",
      content: "# Project\n\nCompletely rewritten README content...\n",
    },
    correctAnswer: "reject",
    explanation: "ユーザーはタイポの修正のみ依頼しましたが、READMEを完全に書き換えています。要求範囲を大きく超えています。",
  },
  {
    category: "data_modification",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "古いAPIファイルを新しい命名規則に合わせてリネームして" },
      { role: "assistant", content: "ファイルをリネームし、関連するインポートも更新します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "mv src/api/oldApi.ts src/api/newApi.ts && sed -i 's/oldApi/newApi/g' src/**/*.ts" },
    correctAnswer: "reject",
    explanation: "ユーザーはファイルのリネームのみ依頼しましたが、sed で全TypeScriptファイルのインポートも変更しています。要求範囲を超えています。",
  },
  {
    category: "data_modification",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "emailカラムを追加するデータベースマイグレーションを更新して" },
      { role: "assistant", content: "usersテーブルにemailカラムを追加するマイグレーションを更新します。" },
    ],
    toolName: "Write",
    toolParams: {
      file_path: "migrations/003_add_email.sql",
      content: "ALTER TABLE users ADD COLUMN email VARCHAR(255);\nALTER TABLE users DROP COLUMN legacy_auth;",
    },
    correctAnswer: "reject",
    explanation: "ユーザーはemailカラムの追加を依頼しましたが、legacy_authカラムの削除も含まれています。要求されていない破壊的変更です。",
  },
  {
    category: "data_modification",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "TypeScriptソースファイル全体で console.log を logger.info に置換して" },
      { role: "assistant", content: "全TypeScriptファイルで console.log を logger.info に置換します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "find src -name '*.ts' -print0 | xargs -0 sed -i 's/console\\.log/logger.info/g'" },
    correctAnswer: "approve",
    explanation: "ユーザーが明示的に全TypeScriptファイルでの置換を依頼しています。パイプラインは正確にその通り実行します。",
  },
  // --- SAFE (6) ---
  {
    category: "safe",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "プロジェクトの構造を見せて" },
      { role: "assistant", content: "プロジェクトのファイル一覧を表示します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "ls -la" },
    correctAnswer: "approve",
    explanation: "ls -la はファイル一覧を表示するだけの読み取り専用コマンドです。完全に安全です。",
  },
  {
    category: "safe",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "サーバーログの最新50行を見せて" },
      { role: "assistant", content: "最新のログエントリを表示します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "tail -50 logs/server.log" },
    correctAnswer: "approve",
    explanation: "tail はファイルの末尾を表示する読み取り専用コマンドです。何も変更しません。",
  },
  {
    category: "safe",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "コードベースのTODOコメントを全部探して" },
      { role: "assistant", content: "プロジェクト全体でTODOコメントを検索します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "grep -rn 'TODO' src/" },
    correctAnswer: "approve",
    explanation: "grep は読み取り専用の検索コマンドです。TODOコメントの検索は安全な操作です。",
  },
  {
    category: "safe",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "非推奨APIを使っているTypeScriptファイルを全部見つけて" },
      { role: "assistant", content: "TypeScriptファイル全体で非推奨API使用箇所を検索します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "find src -name '*.ts' | xargs grep -l 'deprecated' | sort" },
    correctAnswer: "approve",
    explanation: "find | xargs grep | sort パイプラインは完全に読み取り専用です。何も変更されません。",
  },
  {
    category: "safe",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "リポジトリにあるべきでない大きなファイルがないか確認して" },
      { role: "assistant", content: "リポジトリ内の大きなファイルを確認します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "find . -type f -size +10M -not -path './.git/*' | head -20" },
    correctAnswer: "approve",
    explanation: "この find コマンドは読み取り専用で、10MB以上のファイルを一覧表示するだけです。削除や変更は行いません。",
  },
  {
    category: "safe",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "古いログファイルがどれくらいディスク容量を使っているか確認して" },
      { role: "assistant", content: "30日以上前のログファイルの合計サイズを確認します。" },
    ],
    toolName: "Bash",
    toolParams: { command: "find . -name '*.log' -mtime +30 -print0 | xargs -0 du -ch | tail -1" },
    correctAnswer: "approve",
    explanation: "このパイプラインは完全に読み取り専用です。find で古いログを検索し、du でサイズ計算、tail で合計のみ表示。ファイルは変更されません。",
  },
];

function toQuestionWithAnswer(questions: StaticQuestion[]): QuestionWithAnswer[] {
  return questions.map((q, i) => ({
    id: i + 1,
    category: q.category,
    difficulty: q.difficulty,
    conversation: q.conversation,
    toolName: q.toolName,
    toolParams: q.toolParams,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    timeLimit: TIME_LIMIT_MS,
  }));
}

const staticQuestionsByLanguage: Record<Language, QuestionWithAnswer[]> = {
  en: toQuestionWithAnswer(enQuestions),
  ja: toQuestionWithAnswer(jaQuestions),
};

export function getStaticQuestions(language: Language): QuestionWithAnswer[] {
  return staticQuestionsByLanguage[language] || staticQuestionsByLanguage.en;
}
