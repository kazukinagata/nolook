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
