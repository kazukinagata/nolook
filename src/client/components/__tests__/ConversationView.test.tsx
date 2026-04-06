import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ConversationView from "../ConversationView";
import type { ChatMessage } from "../../types";

describe("ConversationView", () => {
  const messages: ChatMessage[] = [
    { role: "user", content: "Please help me refactor this file." },
    { role: "assistant", content: "Sure, I can help with that." },
    { role: "user", content: "Thanks!" },
  ];

  it("renders correct number of messages", () => {
    const { container } = render(<ConversationView messages={messages} />);
    const messageElements = container.querySelectorAll(".chat-message");
    expect(messageElements).toHaveLength(3);
  });

  it("shows User label for user messages", () => {
    render(<ConversationView messages={messages} />);
    const userLabels = screen.getAllByText("User");
    expect(userLabels).toHaveLength(2);
  });

  it("shows Assistant label for assistant messages", () => {
    render(<ConversationView messages={messages} />);
    const assistantLabels = screen.getAllByText("Assistant");
    expect(assistantLabels).toHaveLength(1);
  });

  it("renders message content", () => {
    render(<ConversationView messages={messages} />);
    expect(screen.getByText("Please help me refactor this file.")).toBeInTheDocument();
    expect(screen.getByText("Sure, I can help with that.")).toBeInTheDocument();
  });

  it("renders empty state with no messages", () => {
    const { container } = render(<ConversationView messages={[]} />);
    const messageElements = container.querySelectorAll(".chat-message");
    expect(messageElements).toHaveLength(0);
  });
});
