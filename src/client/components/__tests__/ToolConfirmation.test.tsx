import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ToolConfirmation from "../ToolConfirmation";

describe("ToolConfirmation", () => {
  it("renders Bash command in a code block", () => {
    const onAnswer = vi.fn();
    const { container } = render(
      <ToolConfirmation
        toolName="Bash"
        toolParams={{ command: "rm -rf /tmp/cache" }}
        onAnswer={onAnswer}
        disabled={false}
      />
    );

    const pre = container.querySelector(".tool-command");
    expect(pre).toBeInTheDocument();
    expect(pre!.textContent).toBe("rm -rf /tmp/cache");
  });

  it("renders Edit diff with file_path, old_string, new_string", () => {
    const onAnswer = vi.fn();
    const { container } = render(
      <ToolConfirmation
        toolName="Edit"
        toolParams={{
          file_path: "src/app.ts",
          old_string: "const x = 1;",
          new_string: "const x = 2;",
        }}
        onAnswer={onAnswer}
        disabled={false}
      />
    );

    const pre = container.querySelector(".tool-diff");
    expect(pre).toBeInTheDocument();
    expect(screen.getByText("--- src/app.ts")).toBeInTheDocument();
    expect(screen.getByText("+++ src/app.ts")).toBeInTheDocument();
    expect(screen.getByText("- const x = 1;")).toBeInTheDocument();
    expect(screen.getByText("+ const x = 2;")).toBeInTheDocument();
  });

  it("approve button calls onAnswer with 'approve'", () => {
    const onAnswer = vi.fn();
    render(
      <ToolConfirmation
        toolName="Bash"
        toolParams={{ command: "echo hello" }}
        onAnswer={onAnswer}
        disabled={false}
      />
    );

    fireEvent.click(screen.getByText("Yes"));
    expect(onAnswer).toHaveBeenCalledWith("approve");
  });

  it("reject button calls onAnswer with 'reject'", () => {
    const onAnswer = vi.fn();
    render(
      <ToolConfirmation
        toolName="Bash"
        toolParams={{ command: "echo hello" }}
        onAnswer={onAnswer}
        disabled={false}
      />
    );

    fireEvent.click(screen.getByText("No"));
    expect(onAnswer).toHaveBeenCalledWith("reject");
  });

  it("buttons are disabled when disabled=true", () => {
    const onAnswer = vi.fn();
    render(
      <ToolConfirmation
        toolName="Bash"
        toolParams={{ command: "echo hello" }}
        onAnswer={onAnswer}
        disabled={true}
      />
    );

    const yesBtn = screen.getByText("Yes");
    const noBtn = screen.getByText("No");
    expect(yesBtn).toBeDisabled();
    expect(noBtn).toBeDisabled();
  });

  it("renders tool name in header", () => {
    const onAnswer = vi.fn();
    render(
      <ToolConfirmation
        toolName="Bash"
        toolParams={{ command: "ls" }}
        onAnswer={onAnswer}
        disabled={false}
      />
    );

    expect(screen.getByText("Bash")).toBeInTheDocument();
    expect(screen.getByText("Allow Bash?")).toBeInTheDocument();
  });
});
