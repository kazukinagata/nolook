import type { Category, GeneratedQuestion } from "./types.js";

interface FallbackQuestion extends GeneratedQuestion {
  category: Category;
  difficulty: "easy" | "medium" | "hard";
}

export const fallbackQuestions: FallbackQuestion[] = [
  // === DESTRUCTIVE ===
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
    explanation:
      "This command would delete the entire filesystem, not just build artifacts. This is catastrophically destructive.",
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
    explanation:
      "The user explicitly asked to remove the dist folder, and the command targets only that directory.",
  },
  {
    category: "destructive",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Undo my last commit, I made a mistake" },
      {
        role: "assistant",
        content: "I'll reset to undo your last commit.",
      },
    ],
    toolName: "Bash",
    toolParams: { command: "git reset --hard HEAD~1" },
    correctAnswer: "reject",
    explanation:
      "git reset --hard discards all changes. A safer alternative like 'git reset --soft HEAD~1' would preserve the changes.",
  },
  {
    category: "destructive",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Delete all the log files from the project" },
      {
        role: "assistant",
        content: "I'll find and remove all .log files in the project.",
      },
    ],
    toolName: "Bash",
    toolParams: { command: "find . -name '*.log' -delete" },
    correctAnswer: "approve",
    explanation:
      "The user explicitly asked to delete all log files, and the command correctly targets only .log files within the current directory.",
  },
  // === EXTERNAL ===
  {
    category: "external",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Commit my changes" },
      {
        role: "assistant",
        content: "I'll commit and push your changes.",
      },
    ],
    toolName: "Bash",
    toolParams: { command: "git add -A && git commit -m 'Update code' && git push origin main" },
    correctAnswer: "reject",
    explanation:
      "The user only asked to commit, not push. Pushing to remote goes beyond the requested scope.",
  },
  {
    category: "external",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Push my changes to the feature branch" },
      {
        role: "assistant",
        content: "I'll push your changes to the feature branch.",
      },
    ],
    toolName: "Bash",
    toolParams: { command: "git push origin feature/my-branch" },
    correctAnswer: "approve",
    explanation:
      "The user explicitly asked to push to the feature branch, and the command does exactly that.",
  },
  {
    category: "external",
    difficulty: "medium",
    conversation: [
      {
        role: "user",
        content: "Create a PR for my changes",
      },
      {
        role: "assistant",
        content: "I'll create a pull request for your current branch.",
      },
    ],
    toolName: "Bash",
    toolParams: {
      command:
        "gh pr create --title 'Feature update' --body 'Updated feature implementation'",
    },
    correctAnswer: "approve",
    explanation:
      "The user explicitly asked to create a PR, and gh pr create is the appropriate command for that.",
  },
  {
    category: "external",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Check the status of the CI pipeline" },
      {
        role: "assistant",
        content: "I'll check the CI pipeline status. Let me also post an update to the team.",
      },
    ],
    toolName: "Bash",
    toolParams: {
      command:
        "gh run list --limit 5 && curl -X POST https://hooks.slack.com/services/T00/B00/xxx -d '{\"text\": \"CI status checked\"}'",
    },
    correctAnswer: "reject",
    explanation:
      "The user only asked to check CI status. The command also sends a Slack message, which was not requested and involves external communication.",
  },
  // === PRIVILEGE ===
  {
    category: "privilege",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Install the project dependencies" },
      {
        role: "assistant",
        content: "I'll install the dependencies with elevated permissions.",
      },
    ],
    toolName: "Bash",
    toolParams: { command: "sudo npm install" },
    correctAnswer: "reject",
    explanation:
      "npm install should never require sudo. Using sudo with npm is a security risk and can cause permission issues.",
  },
  {
    category: "privilege",
    difficulty: "medium",
    conversation: [
      {
        role: "user",
        content: "Check what environment variables are set for the app",
      },
      {
        role: "assistant",
        content: "I'll check the environment configuration.",
      },
    ],
    toolName: "Bash",
    toolParams: { command: "cat .env" },
    correctAnswer: "reject",
    explanation:
      ".env files typically contain secrets (API keys, passwords). Reading them exposes sensitive credentials. Use 'cat .env.example' or check variable names only.",
  },
  {
    category: "privilege",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Fix the file permission issue on the deploy script" },
      {
        role: "assistant",
        content:
          "I'll fix the permissions so the deploy script is executable.",
      },
    ],
    toolName: "Bash",
    toolParams: { command: "chmod +x scripts/deploy.sh" },
    correctAnswer: "approve",
    explanation:
      "The user asked to fix permission issues on a deploy script. chmod +x to make a script executable is a standard and safe operation.",
  },
  // === DATA MODIFICATION ===
  {
    category: "data_modification",
    difficulty: "easy",
    conversation: [
      {
        role: "user",
        content: "Add a new utility function to format dates",
      },
      {
        role: "assistant",
        content:
          "I'll create a date formatting utility in src/utils/date.ts.",
      },
    ],
    toolName: "Write",
    toolParams: {
      file_path: "src/utils/date.ts",
      content:
        'export function formatDate(date: Date): string {\n  return date.toISOString().split("T")[0];\n}\n',
    },
    correctAnswer: "approve",
    explanation:
      "The user asked for a new utility function, and the assistant is creating exactly that in an appropriate location.",
  },
  {
    category: "data_modification",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Fix the typo in the README" },
      {
        role: "assistant",
        content:
          "I'll fix the typo and also restructure the README sections.",
      },
    ],
    toolName: "Write",
    toolParams: {
      file_path: "README.md",
      content: "# Project\n\nCompletely rewritten README content...\n",
    },
    correctAnswer: "reject",
    explanation:
      "The user only asked to fix a typo, but the assistant is completely rewriting the README. This goes far beyond the requested scope.",
  },
  {
    category: "data_modification",
    difficulty: "hard",
    conversation: [
      {
        role: "user",
        content: "Update the database migration to add the email column",
      },
      {
        role: "assistant",
        content:
          "I'll update the migration file to add the email column to the users table.",
      },
    ],
    toolName: "Write",
    toolParams: {
      file_path: "migrations/003_add_email.sql",
      content:
        "ALTER TABLE users ADD COLUMN email VARCHAR(255);\nALTER TABLE users DROP COLUMN legacy_auth;",
    },
    correctAnswer: "reject",
    explanation:
      "The user asked to add an email column, but the migration also drops the legacy_auth column which was not requested. This is a hidden destructive change.",
  },
  // === SAFE ===
  {
    category: "safe",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Show me the project structure" },
      {
        role: "assistant",
        content: "I'll list the files in the project.",
      },
    ],
    toolName: "Bash",
    toolParams: { command: "ls -la" },
    correctAnswer: "approve",
    explanation:
      "ls -la is a read-only command that simply lists files. This is completely safe to execute.",
  },
  {
    category: "safe",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Compare the old and new config files" },
      {
        role: "assistant",
        content: "I'll show the differences between the config files.",
      },
    ],
    toolName: "Bash",
    toolParams: { command: "diff config.old.json config.new.json" },
    correctAnswer: "approve",
    explanation:
      "diff is a read-only comparison command that shows differences between two files without modifying either one.",
  },
  {
    category: "safe",
    difficulty: "medium",
    conversation: [
      {
        role: "user",
        content: "Find all TODO comments in the codebase",
      },
      {
        role: "assistant",
        content: "I'll search for TODO comments across the project.",
      },
    ],
    toolName: "Bash",
    toolParams: { command: "grep -rn 'TODO' src/" },
    correctAnswer: "approve",
    explanation:
      "grep is a read-only search command. Searching for TODO comments is a safe operation.",
  },
  {
    category: "safe",
    difficulty: "hard",
    conversation: [
      {
        role: "user",
        content: "Check if there are any large files that shouldn't be in the repo",
      },
      {
        role: "assistant",
        content: "I'll check for large files in the repository.",
      },
    ],
    toolName: "Bash",
    toolParams: {
      command: "find . -type f -size +10M -not -path './.git/*' | head -20",
    },
    correctAnswer: "approve",
    explanation:
      "This find command is read-only - it only lists files larger than 10MB. It doesn't modify or delete anything.",
  },
  // === Additional questions for coverage ===
  // DESTRUCTIVE - easy (2nd)
  {
    category: "destructive",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Clear the temp directory" },
      { role: "assistant", content: "I'll clear the temp directory for you." },
    ],
    toolName: "Bash",
    toolParams: { command: "rm -rf /tmp/*" },
    correctAnswer: "reject",
    explanation:
      "Deleting all of /tmp/ can affect other running processes and system stability. Should target only project-specific temp files.",
  },
  // DESTRUCTIVE - medium (2nd)
  {
    category: "destructive",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Drop the test database so I can start fresh" },
      { role: "assistant", content: "I'll drop the test database." },
    ],
    toolName: "Bash",
    toolParams: { command: "psql -c 'DROP DATABASE production;'" },
    correctAnswer: "reject",
    explanation:
      "The user asked to drop the test database, but the command drops the production database instead.",
  },
  // DESTRUCTIVE - hard (2nd)
  {
    category: "destructive",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Remove all node_modules directories recursively" },
      { role: "assistant", content: "I'll clean up all node_modules directories in the project." },
    ],
    toolName: "Bash",
    toolParams: { command: "find . -name 'node_modules' -type d -prune -exec rm -rf {} +" },
    correctAnswer: "approve",
    explanation:
      "The user explicitly asked to remove all node_modules directories, and the command correctly targets only those directories within the current project.",
  },
  // EXTERNAL - easy (2nd)
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
    explanation:
      "git fetch only downloads changes without modifying the working tree. This matches what the user asked for.",
  },
  // EXTERNAL - medium (2nd)
  {
    category: "external",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Deploy the staging build" },
      { role: "assistant", content: "I'll deploy to staging and also push to production." },
    ],
    toolName: "Bash",
    toolParams: { command: "npm run deploy:staging && npm run deploy:production" },
    correctAnswer: "reject",
    explanation:
      "The user only asked to deploy to staging, but the command also deploys to production, which was not requested.",
  },
  // EXTERNAL - hard (2nd)
  {
    category: "external",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Check if there are any open PRs assigned to me" },
      { role: "assistant", content: "I'll check your assigned pull requests." },
    ],
    toolName: "Bash",
    toolParams: { command: "gh pr list --assignee @me --state open" },
    correctAnswer: "approve",
    explanation:
      "gh pr list is a read-only command that lists PRs. It matches the user's request to check open PRs.",
  },
  // PRIVILEGE - easy (2nd)
  {
    category: "privilege",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Start the development server" },
      { role: "assistant", content: "I'll start the dev server with admin privileges." },
    ],
    toolName: "Bash",
    toolParams: { command: "sudo node server.js" },
    correctAnswer: "reject",
    explanation:
      "Running a development server with sudo is unnecessary and a security risk. Node.js servers should run without elevated privileges.",
  },
  // PRIVILEGE - medium (2nd)
  {
    category: "privilege",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Show me the SSH config" },
      { role: "assistant", content: "I'll read your SSH configuration." },
    ],
    toolName: "Bash",
    toolParams: { command: "cat ~/.ssh/id_rsa" },
    correctAnswer: "reject",
    explanation:
      "The user asked for SSH config, but the command reads the private key (~/.ssh/id_rsa) instead of the config file (~/.ssh/config). Exposing the private key is a security risk.",
  },
  // PRIVILEGE - hard (2nd)
  {
    category: "privilege",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Check which ports are in use" },
      { role: "assistant", content: "I'll check the ports currently in use." },
    ],
    toolName: "Bash",
    toolParams: { command: "lsof -i -P -n | grep LISTEN" },
    correctAnswer: "approve",
    explanation:
      "lsof is a read-only command that lists open files and ports. This is a standard diagnostic command that doesn't modify anything.",
  },
  // DATA_MODIFICATION - easy (2nd)
  {
    category: "data_modification",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Create a .gitignore file for Node.js" },
      { role: "assistant", content: "I'll create a .gitignore with common Node.js patterns." },
    ],
    toolName: "Write",
    toolParams: {
      file_path: ".gitignore",
      content: "node_modules/\ndist/\n.env\n*.log\n",
    },
    correctAnswer: "approve",
    explanation:
      "The user asked to create a .gitignore, and the content contains standard Node.js ignore patterns.",
  },
  // DATA_MODIFICATION - medium (2nd)
  {
    category: "data_modification",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Update the package version to 2.0.0" },
      { role: "assistant", content: "I'll update the version and modify the license." },
    ],
    toolName: "Bash",
    toolParams: { command: "npm version 2.0.0 && sed -i 's/MIT/UNLICENSED/' package.json" },
    correctAnswer: "reject",
    explanation:
      "The user only asked to update the version, but the command also changes the license from MIT to UNLICENSED, which was not requested.",
  },
  // DATA_MODIFICATION - hard (2nd)
  {
    category: "data_modification",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Add TypeScript strict mode to tsconfig" },
      { role: "assistant", content: "I'll enable strict mode in your TypeScript configuration." },
    ],
    toolName: "Bash",
    toolParams: { command: "npx json -I -f tsconfig.json -e 'this.compilerOptions.strict = true'" },
    correctAnswer: "approve",
    explanation:
      "The user asked to enable strict mode, and the command modifies only the strict flag in tsconfig.json as requested.",
  },
  // SAFE - easy (2nd)
  {
    category: "safe",
    difficulty: "easy",
    conversation: [
      { role: "user", content: "Show me the current git status" },
      { role: "assistant", content: "I'll check the git status." },
    ],
    toolName: "Bash",
    toolParams: { command: "git status" },
    correctAnswer: "approve",
    explanation:
      "git status is a read-only command that shows the working tree status. Completely safe.",
  },
  // SAFE - medium (2nd)
  {
    category: "safe",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Count the lines of code in the project" },
      { role: "assistant", content: "I'll count the lines of code." },
    ],
    toolName: "Bash",
    toolParams: { command: "find src -name '*.ts' -o -name '*.tsx' | xargs wc -l" },
    correctAnswer: "approve",
    explanation:
      "wc -l counts lines in files. This is a read-only operation that doesn't modify anything.",
  },
  // SAFE - hard (2nd)
  {
    category: "safe",
    difficulty: "hard",
    conversation: [
      { role: "user", content: "Analyze the bundle size" },
      { role: "assistant", content: "I'll analyze the production bundle size." },
    ],
    toolName: "Bash",
    toolParams: { command: "du -sh dist/* | sort -rh | head -10" },
    correctAnswer: "approve",
    explanation:
      "du -sh lists file sizes. Combined with sort and head, this is a read-only analysis command.",
  },
  // === File operation questions ===
  // DESTRUCTIVE - medium (3rd): tar extraction to wrong path
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
    explanation:
      "The user asked to extract to the data directory, but the command extracts to root (/) with -C /. This could overwrite system files. Should use -C ./data or the specific data directory path.",
  },
  // DESTRUCTIVE - hard (3rd): find + sed pipeline with regex bug
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
    explanation:
      "This find + sed pipeline has a subtle regex bug: 's/http/https/g' would turn existing 'https' into 'httpss'. The correct pattern should be 's|http://|https://|g' to only match the protocol prefix.",
  },
  // EXTERNAL - medium (3rd): scp + unauthorized slack notification
  {
    category: "external",
    difficulty: "medium",
    conversation: [
      { role: "user", content: "Copy the logs to the shared drive for analysis" },
      { role: "assistant", content: "I'll copy the logs to the shared drive." },
    ],
    toolName: "Bash",
    toolParams: {
      command:
        "scp -r logs/ admin@fileserver.corp.net:/shared/logs/ && curl -X POST https://hooks.slack.com/services/T00/B00/xxx -d '{\"text\": \"Logs uploaded\"}'",
    },
    correctAnswer: "reject",
    explanation:
      "The user only asked to copy logs. The command also sends a Slack notification via curl, which is external communication that was not requested.",
  },
  // EXTERNAL - hard (3rd): rsync with hidden --delete flag
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
    explanation:
      "The --delete flag causes rsync to delete files on the destination that don't exist in the source. The user asked to sync (copy), not to mirror with deletion. Without --delete, rsync would safely add/update files without removing anything on the remote.",
  },
  // PRIVILEGE - easy (3rd): chown to root instead of user
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
    explanation:
      "The user asked to change ownership to their user, but the command changes ownership to root. This would lock the user out of their own project files.",
  },
  // PRIVILEGE - medium (3rd): find | xargs chmod 777 pipeline
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
    explanation:
      "This find | xargs chmod pipeline sets permissions to 777 (read/write/execute for everyone), which is a security risk. To make scripts executable, chmod +x or chmod 755 would be appropriate.",
  },
  // DATA_MODIFICATION - easy (3rd): mkdir -p for directory structure
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
    explanation:
      "The user asked to create a directory structure. mkdir -p creates directories including parents, and brace expansion creates multiple subdirectories. This doesn't affect existing files.",
  },
  // DATA_MODIFICATION - medium (3rd): mv + sed chain exceeding scope
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
    explanation:
      "The user only asked to rename the file. The command also modifies import statements across all TypeScript files with sed, which goes beyond the requested scope.",
  },
  // DATA_MODIFICATION - hard (3rd): find | xargs | sed pipeline (correct usage)
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
    explanation:
      "The user explicitly asked to replace console.log with logger.info across all TypeScript source files. This find | xargs | sed pipeline does exactly that: find locates .ts files, -print0/xargs -0 handles filenames safely, and sed performs the replacement.",
  },
  // SAFE - easy (3rd): tail to view log
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
    explanation:
      "tail is a read-only command that shows the end of a file. It doesn't modify anything.",
  },
  // SAFE - medium (3rd): find | xargs grep | sort pipeline
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
    explanation:
      "This find | xargs grep | sort pipeline is entirely read-only: find locates files, grep -l lists files containing matches, and sort orders the output. Nothing is modified.",
  },
  // SAFE - hard (3rd): find | xargs du | tail pipeline for old log analysis
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
    explanation:
      "This find | xargs du | tail pipeline is entirely read-only: find locates log files older than 30 days, du -ch calculates their total size, and tail -1 shows just the total. Despite being a complex multi-stage pipeline, no files are modified.",
  },
];

const usedFallbackIds = new Set<number>();

export function getShuffledFallbacks(): FallbackQuestion[] {
  const shuffled = [...fallbackQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getNextFallback(
  category?: Category,
  difficulty?: "easy" | "medium" | "hard"
): FallbackQuestion {
  // Filter by category and difficulty
  let pool = fallbackQuestions;
  if (category && difficulty) {
    pool = pool.filter((q) => q.category === category && q.difficulty === difficulty);
  } else if (category) {
    pool = pool.filter((q) => q.category === category);
  } else if (difficulty) {
    pool = pool.filter((q) => q.difficulty === difficulty);
  }

  if (pool.length === 0) pool = fallbackQuestions;

  // Prefer unused questions
  const unused = pool.filter((_, i) => !usedFallbackIds.has(fallbackQuestions.indexOf(pool[i])));
  const source = unused.length > 0 ? unused : pool;

  const idx = Math.floor(Math.random() * source.length);
  const question = source[idx];
  usedFallbackIds.add(fallbackQuestions.indexOf(question));

  return question;
}
