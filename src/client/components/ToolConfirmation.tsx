interface Props {
  toolName: string;
  toolParams: Record<string, unknown>;
  onAnswer: (answer: "approve" | "reject") => void;
  disabled: boolean;
}

export default function ToolConfirmation({
  toolName,
  toolParams,
  onAnswer,
  disabled,
}: Props) {
  const renderParams = () => {
    if (toolName === "Bash" && toolParams.command) {
      return (
        <pre className="tool-command">{String(toolParams.command)}</pre>
      );
    }

    if (toolName === "Edit" && toolParams.file_path) {
      const filePath = String(toolParams.file_path);
      const oldStr = String(toolParams.old_string ?? "");
      const newStr = String(toolParams.new_string ?? "");
      return (
        <pre className="tool-diff">
          <div className="diff-header">{"--- " + filePath}</div>
          <div className="diff-header">{"+++ " + filePath}</div>
          {oldStr.split("\n").map((line, i) => (
            <div key={`old-${i}`} className="diff-removed">{"- " + line}</div>
          ))}
          {newStr.split("\n").map((line, i) => (
            <div key={`new-${i}`} className="diff-added">{"+ " + line}</div>
          ))}
        </pre>
      );
    }

    return (
      <pre className="tool-params">
        {Object.entries(toolParams)
          .map(([key, value]) => {
            const displayValue =
              typeof value === "string"
                ? value.length > 200
                  ? value.slice(0, 200) + "..."
                  : value
                : JSON.stringify(value, null, 2);
            return `${key}: ${displayValue}`;
          })
          .join("\n")}
      </pre>
    );
  };

  return (
    <div className="tool-confirmation" style={{ animationDelay: "300ms" }}>
      <div className="tool-call-box">
        <div className="tool-call-header">
          <span className="tool-name">{toolName}</span>
        </div>
        <div className="tool-call-body">{renderParams()}</div>
      </div>

      <div className="permission-prompt">
        <span className="permission-label">Allow {toolName}?</span>
        <div className="permission-buttons">
          <button
            className="perm-btn approve"
            onClick={() => onAnswer("approve")}
            disabled={disabled}
          >
            Yes
          </button>
          <button
            className="perm-btn reject"
            onClick={() => onAnswer("reject")}
            disabled={disabled}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
