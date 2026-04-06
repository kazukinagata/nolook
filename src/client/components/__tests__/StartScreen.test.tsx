import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StartScreen from "../StartScreen";

describe("StartScreen", () => {
  it("renders language buttons (English and Japanese)", () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} />);

    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Japanese")).toBeInTheDocument();
  });

  it("clicking start calls onStart with default language (en)", () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} />);

    fireEvent.click(screen.getByText("Start Test"));
    expect(onStart).toHaveBeenCalledWith("en");
  });

  it("clicking start after selecting Japanese calls onStart with 'ja'", () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} />);

    fireEvent.click(screen.getByText("Japanese"));
    fireEvent.click(screen.getByText("Start Test"));
    expect(onStart).toHaveBeenCalledWith("ja");
  });

  it("start button becomes disabled after click (internal loading state)", () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} />);

    const startBtn = screen.getByText("Start Test");
    fireEvent.click(startBtn);

    // After click, internal loading state disables the button
    const button = screen.getByRole("button", { name: /starting/i });
    expect(button).toBeDisabled();
  });

  it("renders game info (30 questions, 60s, 5 categories)", () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} />);

    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("Questions")).toBeInTheDocument();
    expect(screen.getByText("60s")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
  });
});
