import type { ChatMessage } from "../types";

interface Props {
  messages: ChatMessage[];
}

export default function ConversationView({ messages }: Props) {
  return (
    <div className="conversation-view">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`chat-message ${msg.role}`}
          style={{ animationDelay: `${i * 150}ms` }}
        >
          {msg.role === "user" && (
            <div className="message-bar" />
          )}
          <div className="message-content">
            <span className="message-role">
              {msg.role === "user" ? "User" : "Assistant"}
            </span>
            <p>{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
