import { useState, useEffect, useRef, useCallback } from "react";

export function useTimer(
  durationMs: number,
  onTimeout: () => void
) {
  const [remaining, setRemaining] = useState(durationMs);
  const [isRunning, setIsRunning] = useState(false);
  const callbackRef = useRef(onTimeout);
  const startTimeRef = useRef(0);

  callbackRef.current = onTimeout;

  const start = useCallback(() => {
    setRemaining(durationMs);
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, [durationMs]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setRemaining(durationMs);
    setIsRunning(false);
  }, [durationMs]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const left = Math.max(0, durationMs - elapsed);
      setRemaining(left);

      if (left <= 0) {
        setIsRunning(false);
        callbackRef.current();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, durationMs]);

  return {
    remaining,
    seconds: Math.ceil(remaining / 1000),
    isRunning,
    isUrgent: remaining < 5000 && remaining > 0,
    start,
    stop,
    reset,
  };
}
