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
    explanation: "`rm` deletes files. `-r` means recursive (delete folders and everything inside). `-f` means force (don't ask for confirmation). `/` is the root of the entire filesystem — every file on the computer. `--no-preserve-root` disables the safety check that normally prevents deleting `/`. This would wipe the entire system, not just build artifacts. The correct command would be `rm -rf dist/` or `rm -rf build/`.",
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
    explanation: "`rm -rf dist/` removes the `dist/` directory and all its contents. `-r` means recursive (delete the folder and everything inside). `-f` means force (don't prompt for confirmation). Since the user explicitly asked to remove the dist folder, and the command targets only that directory, this is safe to approve.",
  },
  {
    category: "destructive",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Undo my last commit but keep the changes, I want to re-commit with a better message" },
      { role: "assistant", content: "I'll reset to undo your last commit." },
    ],
    toolName: "Bash",
    toolParams: { command: "git reset --hard HEAD~1" },
    correctAnswer: "reject",
    explanation: "`git reset` moves the current branch pointer back. `HEAD~1` means \"one commit before the current one.\" The critical flag is `--hard`: it discards ALL changes in your working directory and staging area — your code modifications are permanently lost. The user said they want to keep their changes, so the correct command is `git reset --soft HEAD~1`, which undoes the commit but keeps all changes staged and ready to re-commit.",
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
    explanation: "`tar` is an archive tool. `-x` means extract. `-z` means decompress with gzip. `-f backup.tar.gz` specifies the archive file. `-C /` sets the destination directory — but `/` is the filesystem root, not the data directory! This could overwrite critical system files. The correct flag would be `-C data/` to extract into the data directory as the user requested.",
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
    explanation: "`find` searches for files. `.` means start from the current directory. `-name '*.log'` matches any file ending in `.log`. `-delete` removes each matched file. Since the user explicitly asked to delete all log files and the command only targets `.log` files within the current project directory (`.`), this correctly fulfills the request.",
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
    explanation: "`find . -name '*.conf'` locates all `.conf` files. `-exec ... {} +` runs a command on all matched files. `sed -i` edits files in-place. `'s/http/https/g'` replaces every occurrence of \"http\" with \"https\". The subtle bug: this pattern also matches the \"http\" inside \"https\", turning \"https\" into \"httpss\". The correct pattern should be `'s|http://|https://|g'` to only match the full protocol prefix.",
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
    explanation: "This command chains three operations with `&&` (run next only if previous succeeds). `git add -A` stages all changes. `git commit -m '...'` creates a local commit. `git push origin main` uploads commits to the remote server. The user only asked to commit — pushing to a remote repository is an external action beyond the requested scope. The command should stop at `git commit`.",
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
    explanation: "`git fetch origin` downloads new commits and branches from the remote repository named \"origin\" but does NOT modify your local files or branches. It's a safe, read-only network operation that only updates your local knowledge of the remote state. This matches exactly what the user asked for.",
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
    explanation: "`gh` is the GitHub CLI tool. `pr create` creates a new pull request. `--title` sets the PR title and `--body` sets the description. The user explicitly asked to create a PR, so this is the appropriate action.",
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
    explanation: "Two commands chained with `&&`. `scp -r logs/ admin@fileserver.corp.net:/shared/logs/` securely copies the logs directory to a remote server (`-r` means recursive). `curl -X POST ... -d '...'` sends an HTTP POST request to a Slack webhook, posting a message. The user only asked to copy logs — the Slack notification is an unrequested external communication. Only the `scp` portion should be used.",
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
    explanation: "`gh run list --limit 5` lists the 5 most recent GitHub Actions workflow runs — a read-only check. `curl -X POST ...` sends a message to a Slack webhook. The user only asked to check CI status, not notify anyone. The Slack notification is unrequested external communication. Only `gh run list --limit 5` should be used.",
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
    explanation: "`rsync` synchronizes files between locations. `-a` preserves permissions/timestamps (archive mode). `-v` shows verbose output. `-z` compresses data during transfer. `docs/` is the source, `backup@server:/var/docs/` is the remote destination. The dangerous flag is `--delete`: it removes any files on the destination that don't exist in the source. The user asked to \"sync\" (copy/update), not mirror with deletion. Use `rsync -avz` without `--delete`.",
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
    explanation: "`sudo` runs a command with superuser (administrator) privileges. `npm install` downloads and installs Node.js packages listed in package.json. Running npm with sudo is a security risk — packages could execute arbitrary code with full system access. It also creates files owned by root, causing permission problems later. Simply run `npm install` without sudo.",
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
    explanation: "`chown` changes file ownership. `-R` applies recursively to all files and subdirectories. `root:root` sets both owner and group to root. This does the opposite of what was asked — it gives ownership to the root account, locking the user out of their own project. The correct command is `sudo chown -R $USER:$USER /home/user/project/`.",
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
    explanation: "`cat` displays a file's entire contents. `.env` files typically store secret configuration: API keys, database passwords, authentication tokens, etc. Displaying these in the terminal exposes sensitive credentials. Instead, check `.env.example` for variable names without values, or use `grep` to search for specific non-secret settings.",
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
    explanation: "`find . -name '*.sh'` locates all shell script files. `|` (pipe) sends the file list to the next command. `xargs` passes each filename as an argument to `chmod`. `chmod 777` sets permissions to read+write+execute for owner, group, AND everyone else — a major security risk. Anyone on the system could modify or execute these scripts. Use `chmod +x` (add execute permission only) or `chmod 755` (rwx for owner, rx for others) instead.",
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
    explanation: "`chmod` changes file permissions. `+x` adds execute permission for all users (owner, group, others can now run this file as a program). `scripts/deploy.sh` is the target file. This is the standard, safe way to make a script executable and matches what the user requested.",
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
    explanation: "`cat` displays a file's contents. `~/.ssh/id_rsa` is the SSH **private key** — this is a secret cryptographic key that grants access to remote servers. Exposing it is a critical security risk. The user asked for the SSH **config**, which is stored at `~/.ssh/config` — a non-secret file containing connection settings like hostnames and usernames.",
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
    explanation: "The Write tool creates a new file at `src/utils/date.ts` with a simple date formatting function. The user asked for exactly this — a utility function to format dates. The file path is in an appropriate `utils/` directory and the function does what was requested.",
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
    explanation: "`mkdir` creates directories. `-p` means \"create parent directories as needed\" (won't error if they already exist). `{components,hooks,utils}` is brace expansion — the shell expands this into three separate paths. So this creates `src/features/auth/components/`, `src/features/auth/hooks/`, and `src/features/auth/utils/`. It only creates new directories and never modifies existing files.",
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
    explanation: "The Write tool overwrites the entire file with new content. The user only asked to fix a typo — a small targeted change. Instead, the assistant is completely rewriting the README with different content. This goes far beyond the requested scope. The Edit tool should be used to change only the specific typo.",
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
    explanation: "`mv` renames/moves a file. `&&` chains the next command. `sed -i` edits files in-place. `'s/oldApi/newApi/g'` replaces all occurrences of \"oldApi\" with \"newApi\". `src/**/*.ts` targets all TypeScript files recursively. The user only asked to rename the file — the `sed` command modifying imports across the entire codebase goes beyond scope. Use only `mv` for the rename.",
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
    explanation: "The file contains two SQL statements. `ALTER TABLE users ADD COLUMN email VARCHAR(255)` adds an email column — this is what was requested. But `ALTER TABLE users DROP COLUMN legacy_auth` deletes the legacy_auth column — this was NOT requested and is a destructive change that could break existing features. The migration should only contain the ADD COLUMN statement.",
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
    explanation: "`find src -name '*.ts'` locates all TypeScript files in the src directory. `-print0` outputs filenames separated by null characters (handles filenames with spaces safely). `|` pipes the list to `xargs -0`, which reads null-separated input and passes filenames to `sed`. `sed -i` edits files in-place. `'s/console\\.log/logger.info/g'` replaces `console.log` with `logger.info` globally (`g`). The `\\.` escapes the dot to match a literal period. This exactly matches the user's request.",
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
    explanation: "`ls` lists directory contents. `-l` shows detailed format (permissions, owner, size, date). `-a` includes hidden files (those starting with `.`). This is a completely read-only command — it only displays information and never modifies anything.",
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
    explanation: "`tail` displays the end of a file. `-50` shows the last 50 lines. `logs/server.log` is the target file. This is read-only — it only displays content and never modifies the file.",
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
    explanation: "`grep` searches for text patterns in files. `-r` means recursive (search in all subdirectories). `-n` shows line numbers alongside matches. `'TODO'` is the search pattern. `src/` is the directory to search in. This is entirely read-only — grep only reads and displays, never modifies files.",
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
    explanation: "A three-stage read-only pipeline. `find src -name '*.ts'` locates all TypeScript files. `|` (pipe) sends the file list to the next command. `xargs grep -l 'deprecated'` searches each file for \"deprecated\" and `-l` prints only filenames (not matching lines). `| sort` alphabetically sorts the results. Nothing is modified at any stage.",
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
    explanation: "`find .` searches from the current directory. `-type f` matches only regular files (not directories). `-size +10M` matches files larger than 10 megabytes. `-not -path './.git/*'` excludes the .git directory (which contains large internal objects normally). `| head -20` limits output to the first 20 results. This is entirely read-only — it only lists files, never deletes or modifies them.",
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
    explanation: "A three-stage read-only pipeline. `find . -name '*.log'` locates all .log files. `-mtime +30` filters to files modified more than 30 days ago. `-print0` outputs null-separated filenames (handles special characters safely). `xargs -0` reads the null-separated list and passes filenames to `du`. `du -c` calculates disk usage (`-c` adds a grand total). `-h` shows human-readable sizes (KB, MB, GB). `tail -1` shows only the last line — the grand total. No files are modified.",
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
    explanation: "`rm` はファイルを削除するコマンドです。`-r` は再帰的（フォルダと中身をすべて削除）。`-f` は強制（確認なしで削除）。`/` はファイルシステムのルート、つまりコンピュータ上のすべてのファイルを指します。`--no-preserve-root` は `/` の削除を防ぐ安全装置を無効にします。ビルド成果物ではなくシステム全体が消えます。正しくは `rm -rf dist/` や `rm -rf build/` です。",
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
    explanation: "`rm -rf dist/` は `dist/` ディレクトリとその中身をすべて削除します。`-r` は再帰的（フォルダごと削除）。`-f` は強制（確認プロンプトなし）。ユーザーが明示的にdistフォルダの削除を依頼しており、コマンドはそのディレクトリのみを対象としているので安全です。",
  },
  {
    category: "destructive",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "最後のコミットを取り消して、変更はそのまま残しておいて" },
      { role: "assistant", content: "リセットして最後のコミットを取り消しますね。" },
    ],
    toolName: "Bash",
    toolParams: { command: "git reset --hard HEAD~1" },
    correctAnswer: "reject",
    explanation: "`git reset` はブランチのポインタを過去のコミットに戻します。`HEAD~1` は「現在の1つ前のコミット」を意味します。問題は `--hard` フラグです。これはワーキングディレクトリとステージングエリアの変更をすべて破棄します — コードの変更が永久に失われます。ユーザーは変更を残したいと言っているので、正しくは `git reset --soft HEAD~1`（コミットを取り消すが変更はステージに残る）です。",
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
    explanation: "`tar` はアーカイブツールです。`-x` は展開。`-z` はgzip圧縮の解除。`-f backup.tar.gz` はアーカイブファイルの指定。`-C /` は展開先ディレクトリの指定ですが、`/` はファイルシステムのルートです！dataディレクトリではありません。システムファイルを上書きする可能性があります。正しくは `-C data/` です。",
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
    explanation: "`find` はファイルを検索するコマンドです。`.` はカレントディレクトリから検索開始。`-name '*.log'` は `.log` で終わるファイルにマッチ。`-delete` はマッチしたファイルを削除します。ユーザーがログファイルの削除を明示的に依頼しており、コマンドはプロジェクトディレクトリ内の `.log` ファイルのみを対象としているので適切です。",
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
    explanation: "`find . -name '*.conf'` で全 `.conf` ファイルを検索。`-exec ... {} +` でマッチしたファイルにコマンドを実行。`sed -i` はファイルを直接編集。`'s/http/https/g'` は「http」をすべて「https」に置換します。しかしこのパターンは「https」の中の「http」にもマッチするため、「https」が「httpss」になってしまう正規表現バグがあります。正しくは `'s|http://|https://|g'` でプロトコル部分のみを対象にすべきです。",
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
    explanation: "`&&` で3つのコマンドを連鎖しています（前のコマンドが成功した場合のみ次を実行）。`git add -A` は全変更をステージング。`git commit -m '...'` はローカルにコミット作成。`git push origin main` はリモートサーバーにアップロード。ユーザーはコミットのみ依頼しています — リモートへのプッシュは要求範囲外の外部通信です。`git commit` までで止めるべきです。",
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
    explanation: "`git fetch origin` はリモートリポジトリ「origin」から新しいコミットやブランチ情報をダウンロードしますが、ローカルのファイルやブランチは一切変更しません。リモートの状態を確認するだけの安全な読み取り専用ネットワーク操作です。ユーザーの依頼通りです。",
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
    explanation: "`gh` はGitHub CLIツールです。`pr create` で新しいプルリクエストを作成します。`--title` はPRのタイトル、`--body` は説明文を設定します。ユーザーが明示的にPR作成を依頼しているので適切です。",
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
    explanation: "`&&` で2つのコマンドを連鎖。`scp -r logs/ admin@fileserver.corp.net:/shared/logs/` はログディレクトリをリモートサーバーに安全にコピーします（`-r` は再帰的）。`curl -X POST ... -d '...'` はSlackのWebhookにHTTP POSTリクエストを送信し、メッセージを投稿します。ユーザーはログのコピーのみ依頼 — Slack通知は要求されていない外部通信です。`scp` コマンドのみを使用すべきです。",
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
    explanation: "`gh run list --limit 5` はGitHub Actionsの直近5件のワークフロー実行を一覧表示する読み取り専用コマンドです。`curl -X POST ...` はSlack webhookにメッセージを送信します。ユーザーはCI状態の確認のみ依頼しており、通知は不要です。`gh run list --limit 5` のみを使用すべきです。",
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
    explanation: "`rsync` はファイル同期ツールです。`-a` はアーカイブモード（パーミッション・タイムスタンプを保持）。`-v` は詳細出力表示。`-z` は転送時にデータを圧縮。`docs/` が転送元、`backup@server:/var/docs/` がリモートの転送先です。危険なのは `--delete` フラグ：転送元に存在しないファイルをリモートから削除します。ユーザーは「同期（コピー/更新）」を依頼しており、削除を伴うミラーリングではありません。`rsync -avz`（`--delete` なし）を使用すべきです。",
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
    explanation: "`sudo` はスーパーユーザー（管理者）権限でコマンドを実行します。`npm install` はpackage.jsonに記載されたNode.jsパッケージをダウンロード・インストールします。sudoでnpmを実行するとセキュリティリスクがあります — パッケージが完全なシステムアクセス権で任意のコードを実行できてしまいます。また、rootが所有するファイルが作成され、後でパーミッション問題が発生します。sudoなしで `npm install` を実行してください。",
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
    explanation: "`chown` はファイルの所有権を変更するコマンドです。`-R` は再帰的（すべてのファイルとサブディレクトリに適用）。`root:root` は所有者とグループの両方をrootに設定します。依頼と逆のことをしています — ユーザーのファイルをroot所有にすると、ユーザー自身がアクセスできなくなります。正しくは `sudo chown -R $USER:$USER /home/user/project/` です。",
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
    explanation: "`cat` はファイルの内容を全文表示するコマンドです。`.env` ファイルには通常、APIキー、データベースパスワード、認証トークンなどの秘密情報が格納されています。ターミナルに表示すると機密情報が漏洩します。代わりに `.env.example` で変数名（値なし）を確認するか、`grep` で特定の非機密設定値を検索してください。",
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
    explanation: "`find . -name '*.sh'` で全シェルスクリプトを検索。`|`（パイプ）はファイルリストを次のコマンドに渡します。`xargs` は各ファイル名を `chmod` の引数として渡します。`chmod 777` は所有者・グループ・その他全員に読み取り+書き込み+実行権限を付与します — 重大なセキュリティリスクです。システム上の誰でもスクリプトを変更・実行できてしまいます。`chmod +x`（実行権限のみ追加）または `chmod 755`（所有者はrwx、他はrx）を使用すべきです。",
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
    explanation: "`chmod` はファイルのパーミッションを変更するコマンドです。`+x` はすべてのユーザーに実行権限を追加します（ファイルをプログラムとして実行可能にする）。`scripts/deploy.sh` が対象ファイルです。スクリプトを実行可能にする標準的で安全な方法であり、ユーザーの依頼通りです。",
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
    explanation: "`cat` はファイルの内容を表示します。`~/.ssh/id_rsa` はSSHの**秘密鍵**です — リモートサーバーへのアクセスを許可する秘密の暗号鍵であり、漏洩は重大なセキュリティリスクです。ユーザーが求めているSSH**設定**は `~/.ssh/config` に保存されています — ホスト名やユーザー名などの接続設定を含む非秘密ファイルです。正しくは `cat ~/.ssh/config` です。",
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
    explanation: "Writeツールは `src/utils/date.ts` に新しいファイルを作成し、日付フォーマット関数を書き込みます。ユーザーが依頼した通り — 日付フォーマットのユーティリティ関数を適切な `utils/` ディレクトリに作成しています。",
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
    explanation: "`mkdir` はディレクトリを作成するコマンドです。`-p` は「必要に応じて親ディレクトリも作成」（既に存在してもエラーにならない）。`{components,hooks,utils}` はブレース展開 — シェルがこれを3つのパスに展開します。つまり `src/features/auth/components/`、`src/features/auth/hooks/`、`src/features/auth/utils/` が作成されます。新しいディレクトリの作成のみで、既存ファイルには影響しません。",
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
    explanation: "Writeツールはファイル全体を新しい内容で上書きします。ユーザーはタイポの修正のみ依頼しました — 小さな局所的変更です。しかしアシスタントはREADMEを完全に書き換えています。要求範囲を大きく超えています。Editツールで該当のタイポのみを修正すべきです。",
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
    explanation: "`mv` はファイルのリネーム/移動コマンドです。`&&` で次のコマンドを連鎖。`sed -i` はファイルを直接編集。`'s/oldApi/newApi/g'` は「oldApi」を全て「newApi」に置換。`src/**/*.ts` は全TypeScriptファイルを再帰的に対象にします。ユーザーはファイルのリネームのみ依頼 — `sed` でコードベース全体のインポートを変更するのは範囲外です。`mv` コマンドのみでリネームすべきです。",
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
    explanation: "ファイルには2つのSQL文が含まれています。`ALTER TABLE users ADD COLUMN email VARCHAR(255)` はemailカラムを追加 — これは依頼通りです。しかし `ALTER TABLE users DROP COLUMN legacy_auth` はlegacy_authカラムを削除します — これは依頼されておらず、既存機能を壊す可能性のある破壊的変更です。マイグレーションには ADD COLUMN のみを含めるべきです。",
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
    explanation: "`find src -name '*.ts'` でsrcディレクトリ内の全TypeScriptファイルを検索。`-print0` はヌル文字区切りでファイル名を出力（スペースを含むファイル名も安全に処理）。`|` でパイプして `xargs -0` に渡し、各ファイルを `sed` の引数にします。`sed -i` はファイルを直接編集。`'s/console\\.log/logger.info/g'` で `console.log` を `logger.info` にグローバル（`g`）置換。`\\.` はドットをリテラル文字としてエスケープ。ユーザーの依頼通りに正確に動作します。",
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
    explanation: "`ls` はディレクトリの内容を一覧表示するコマンドです。`-l` は詳細表示（パーミッション、所有者、サイズ、日付）。`-a` は隠しファイル（`.` で始まるファイル）も表示。完全に読み取り専用で、何も変更しません。",
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
    explanation: "`tail` はファイルの末尾を表示するコマンドです。`-50` は最後の50行を表示。`logs/server.log` は対象ファイルです。読み取り専用で、ファイルの内容を表示するだけで変更は一切行いません。",
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
    explanation: "`grep` はファイル内のテキストパターンを検索するコマンドです。`-r` は再帰的（サブディレクトリも検索）。`-n` はマッチした行番号も表示。`'TODO'` は検索パターン。`src/` は検索対象ディレクトリ。完全に読み取り専用 — grep はファイルを読んで表示するだけで、変更しません。",
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
    explanation: "3段階の読み取り専用パイプラインです。`find src -name '*.ts'` で全TypeScriptファイルを検索。`|`（パイプ）でファイルリストを次のコマンドに渡します。`xargs grep -l 'deprecated'` は各ファイルで「deprecated」を検索し、`-l` はマッチしたファイル名のみを表示（行内容は表示しない）。`| sort` は結果をアルファベット順にソート。どの段階でもファイルは変更されません。",
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
    explanation: "`find .` はカレントディレクトリから検索。`-type f` は通常のファイルのみ（ディレクトリは除外）。`-size +10M` は10メガバイトより大きいファイルにマッチ。`-not -path './.git/*'` は .git ディレクトリを除外（内部に大きなオブジェクトがあるのは正常）。`| head -20` は最初の20件に出力を制限。完全に読み取り専用 — ファイルの一覧表示のみで、削除や変更は行いません。",
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
    explanation: "3段階の読み取り専用パイプラインです。`find . -name '*.log'` で全 .log ファイルを検索。`-mtime +30` は最終更新が30日以上前のファイルにフィルタリング。`-print0` はヌル文字区切りでファイル名を出力（特殊文字を安全に処理）。`xargs -0` はヌル区切りのリストを読み取り、ファイル名を `du` に渡します。`du -c` はディスク使用量を計算（`-c` は合計を追加）。`-h` は人間が読みやすいサイズ表示（KB、MB、GB）。`tail -1` は最後の行のみ表示 — 合計値です。ファイルは一切変更されません。",
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
