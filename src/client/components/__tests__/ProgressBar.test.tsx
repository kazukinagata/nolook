import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBar from "../ProgressBar";

describe("ProgressBar", () => {
  it("renders Q current/total text", () => {
    render(<ProgressBar current={5} total={30} />);
    expect(screen.getByText("Q 5/30")).toBeInTheDocument();
  });

  it("progress bar width matches percentage", () => {
    const { container } = render(<ProgressBar current={15} total={30} />);
    const fill = container.querySelector(".progress-fill") as HTMLElement;
    expect(fill.style.width).toBe("50%");
  });

  it("shows 0% for 0 answered", () => {
    const { container } = render(<ProgressBar current={0} total={30} />);
    const fill = container.querySelector(".progress-fill") as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });

  it("shows 100% when all answered", () => {
    const { container } = render(<ProgressBar current={30} total={30} />);
    const fill = container.querySelector(".progress-fill") as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });
});
