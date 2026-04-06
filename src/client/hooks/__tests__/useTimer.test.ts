import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimer } from "../useTimer";

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has correct initial state", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useTimer(10000, onTimeout));

    expect(result.current.remaining).toBe(10000);
    expect(result.current.seconds).toBe(10);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isUrgent).toBe(false);
  });

  it("counts down after start", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useTimer(10000, onTimeout));

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.remaining).toBeLessThanOrEqual(7100);
    expect(result.current.remaining).toBeGreaterThanOrEqual(6900);
  });

  it("stop pauses the countdown", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useTimer(10000, onTimeout));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.isRunning).toBe(false);
    const remainingAfterStop = result.current.remaining;

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.remaining).toBe(remainingAfterStop);
  });

  it("reset returns to duration", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useTimer(10000, onTimeout));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.remaining).toBe(10000);
    expect(result.current.isRunning).toBe(false);
  });

  it("fires onTimeout when duration elapses", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useTimer(5000, onTimeout));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(5200);
    });

    expect(onTimeout).toHaveBeenCalled();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.remaining).toBe(0);
  });

  it("isUrgent becomes true when remaining < 5000ms", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useTimer(10000, onTimeout));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(result.current.isUrgent).toBe(true);
  });

  it("seconds is Math.ceil(remaining / 1000)", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useTimer(10000, onTimeout));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(result.current.seconds).toBe(Math.ceil(result.current.remaining / 1000));
  });
});
