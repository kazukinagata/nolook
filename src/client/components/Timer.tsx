import { useEffect } from "react";
import { useTimer } from "../hooks/useTimer";

interface Props {
  duration: number;
  onTimeout: () => void;
}

export default function Timer({ duration, onTimeout }: Props) {
  const timer = useTimer(duration, onTimeout);

  useEffect(() => {
    timer.start();
    return () => timer.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = timer.remaining / duration;

  return (
    <div className={`timer ${timer.isUrgent ? "urgent" : ""}`}>
      <div className="timer-bar-container">
        <div
          className="timer-bar"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="timer-text">{timer.seconds}s</span>
    </div>
  );
}
