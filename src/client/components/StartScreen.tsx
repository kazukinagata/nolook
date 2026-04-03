import { useState, useEffect, useRef } from "react";
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

interface Tip {
  desc: string;
  example: string;
}

const commandTips: Record<Language, Tip[]> = {
  en: [
    { desc: "ls lists files in the current directory", example: "ls -la /home/user" },
    { desc: "cd changes the current working directory", example: "cd ~/projects/my-app" },
    { desc: "cat displays the contents of a file", example: "cat package.json" },
    { desc: "grep searches for patterns in files", example: "grep -r \"TODO\" src/" },
    { desc: "chmod changes file permissions", example: "chmod 755 deploy.sh" },
    { desc: "rm removes files — rm -rf deletes recursively", example: "rm -rf node_modules/" },
    { desc: "mv moves or renames files and directories", example: "mv old-name.ts new-name.ts" },
    { desc: "cp copies files — use -r for directories", example: "cp -r src/ src-backup/" },
    { desc: "pipe (|) sends one command's output to another", example: "cat log.txt | grep \"ERROR\"" },
    { desc: "echo $PATH shows your executable search paths", example: "echo $HOME" },
    { desc: "find searches for files by name, type, or date", example: "find . -name \"*.tsx\"" },
    { desc: "curl fetches data from URLs", example: "curl -s https://api.example.com/status" },
    { desc: "tail -f follows a log file in real time", example: "tail -f /var/log/app.log" },
    { desc: "ssh connects to remote servers securely", example: "ssh user@192.168.1.10" },
  ],
  ja: [
    { desc: "ls はカレントディレクトリのファイル一覧を表示します", example: "ls -la /home/user" },
    { desc: "cd はワーキングディレクトリを変更します", example: "cd ~/projects/my-app" },
    { desc: "cat はファイルの内容を表示します", example: "cat package.json" },
    { desc: "grep はファイル内のパターンを検索します", example: "grep -r \"TODO\" src/" },
    { desc: "chmod はファイルの権限を変更します", example: "chmod 755 deploy.sh" },
    { desc: "rm はファイルを削除します — rm -rf は再帰削除", example: "rm -rf node_modules/" },
    { desc: "mv はファイルの移動・リネームに使います", example: "mv old-name.ts new-name.ts" },
    { desc: "cp はファイルをコピーします — ディレクトリには -r", example: "cp -r src/ src-backup/" },
    { desc: "パイプ (|) はコマンドの出力を次のコマンドに渡します", example: "cat log.txt | grep \"ERROR\"" },
    { desc: "echo $PATH で検索パスを確認できます", example: "echo $HOME" },
    { desc: "find はファイル名・種類・日付でファイルを検索します", example: "find . -name \"*.tsx\"" },
    { desc: "curl は URL からデータを取得します", example: "curl -s https://api.example.com/status" },
    { desc: "tail -f はログファイルをリアルタイムで監視します", example: "tail -f /var/log/app.log" },
    { desc: "ssh はリモートサーバーに安全に接続します", example: "ssh user@192.168.1.10" },
  ],
  ko: [
    { desc: "ls 는 현재 디렉토리의 파일 목록을 표시합니다", example: "ls -la /home/user" },
    { desc: "cd 는 작업 디렉토리를 변경합니다", example: "cd ~/projects/my-app" },
    { desc: "cat 은 파일의 내용을 출력합니다", example: "cat package.json" },
    { desc: "grep 은 파일에서 패턴을 검색합니다", example: "grep -r \"TODO\" src/" },
    { desc: "chmod 는 파일 권한을 변경합니다", example: "chmod 755 deploy.sh" },
    { desc: "rm 은 파일을 삭제합니다 — rm -rf 는 재귀 삭제", example: "rm -rf node_modules/" },
    { desc: "mv 는 파일을 이동하거나 이름을 변경합니다", example: "mv old-name.ts new-name.ts" },
    { desc: "cp 는 파일을 복사합니다 — 디렉토리는 -r", example: "cp -r src/ src-backup/" },
    { desc: "파이프 (|) 는 명령어의 출력을 다른 명령어로 전달합니다", example: "cat log.txt | grep \"ERROR\"" },
    { desc: "echo $PATH 로 검색 경로를 확인합니다", example: "echo $HOME" },
    { desc: "find 는 이름, 유형, 날짜로 파일을 검색합니다", example: "find . -name \"*.tsx\"" },
    { desc: "curl 은 URL 에서 데이터를 가져옵니다", example: "curl -s https://api.example.com/status" },
    { desc: "tail -f 는 로그 파일을 실시간으로 모니터링합니다", example: "tail -f /var/log/app.log" },
    { desc: "ssh 는 원격 서버에 안전하게 접속합니다", example: "ssh user@192.168.1.10" },
  ],
  zh: [
    { desc: "ls 列出当前目录中的文件", example: "ls -la /home/user" },
    { desc: "cd 更改当前工作目录", example: "cd ~/projects/my-app" },
    { desc: "cat 显示文件的内容", example: "cat package.json" },
    { desc: "grep 在文件中搜索模式", example: "grep -r \"TODO\" src/" },
    { desc: "chmod 更改文件权限", example: "chmod 755 deploy.sh" },
    { desc: "rm 删除文件 — rm -rf 递归删除目录", example: "rm -rf node_modules/" },
    { desc: "mv 移动或重命名文件和目录", example: "mv old-name.ts new-name.ts" },
    { desc: "cp 复制文件 — 目录请使用 -r", example: "cp -r src/ src-backup/" },
    { desc: "管道 (|) 将一个命令的输出传递给另一个命令", example: "cat log.txt | grep \"ERROR\"" },
    { desc: "echo $PATH 显示可执行文件的搜索路径", example: "echo $HOME" },
    { desc: "find 按名称、类型或日期搜索文件", example: "find . -name \"*.tsx\"" },
    { desc: "curl 从 URL 获取数据", example: "curl -s https://api.example.com/status" },
    { desc: "tail -f 实时监控日志文件", example: "tail -f /var/log/app.log" },
    { desc: "ssh 安全连接到远程服务器", example: "ssh user@192.168.1.10" },
  ],
};

function triggerPrefetch(language: Language) {
  fetch(`/api/game/prefetch?language=${language}`).catch(() => {});
}

export default function StartScreen({ onStart }: Props) {
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const prefetchedRef = useRef<Set<Language>>(new Set());

  // Prefetch for default language on mount
  useEffect(() => {
    triggerPrefetch("en");
    prefetchedRef.current.add("en");
  }, []);

  // Rotate tips every 5 seconds during loading
  useEffect(() => {
    if (!loading) return;
    setTipIndex(0);
    setTipVisible(true);
    const interval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % commandTips[language].length);
        setTipVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [loading, language]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    if (!prefetchedRef.current.has(lang)) {
      triggerPrefetch(lang);
      prefetchedRef.current.add(lang);
    }
  };

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
          50 Claude Code approval prompts. 60 seconds each.
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
                onClick={() => handleLanguageChange(lang.code)}
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
              <span className="loading-dots">Generating questions</span>
            </span>
          ) : (
            "Start Test"
          )}
        </button>

        {loading && (
          <div className={`loading-tip ${tipVisible ? "visible" : ""}`}>
            <span className="tip-icon">💡</span>
            <div className="tip-content">
              <span className="tip-desc">{commandTips[language][tipIndex].desc}</span>
              <code className="tip-example">$ {commandTips[language][tipIndex].example}</code>
            </div>
          </div>
        )}

        <div className="start-info">
          <div className="info-item">
            <span className="info-icon">50</span>
            <span>Questions</span>
          </div>
          <div className="info-item">
            <span className="info-icon">60s</span>
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
