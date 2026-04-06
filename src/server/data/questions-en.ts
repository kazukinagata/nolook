import type { QuestionWithAnswer } from "../types.js";

type StaticQuestion = Omit<QuestionWithAnswer, "id" | "timeLimit">;

// === English Static Questions (30) ===
export const enQuestions: StaticQuestion[] = [
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
