import { useCallback, useEffect, useRef, useState } from "react";

const ANIMATION_TYPES = ["bomb", "door", "roulette"] as const;
type AnimationType = (typeof ANIMATION_TYPES)[number];

const SRC_MAP: Record<AnimationType, string> = {
  bomb: "/prototypes/bomb-canvas-3d.html",
  door: "/prototypes/door-canvas-3d.html",
  roulette: "/prototypes/roulette-canvas-3d.html",
};

interface Props {
  isCorrect: boolean;
  onComplete: () => void;
  skippable: boolean;
}

export default function AnimationOverlay({ isCorrect, onComplete, skippable }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const completedRef = useRef(false);
  const [animType] = useState<AnimationType>(
    () => ANIMATION_TYPES[Math.floor(Math.random() * ANIMATION_TYPES.length)]
  );
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "animationComplete" && !completedRef.current) {
        completedRef.current = true;
        setFading(true);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const skip = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      setFading(true);
    }
  }, []);

  // Skip on key press
  useEffect(() => {
    if (!skippable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skippable, skip]);

  // Safety timeout in case iframe fails to send completion
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        setFading(true);
      }
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  const handleLoad = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "start", isCorrect },
      window.location.origin
    );
  };

  const handleTransitionEnd = () => {
    if (fading) onComplete();
  };

  return (
    <div
      className={`animation-overlay${fading ? " fading" : ""}`}
      onTransitionEnd={handleTransitionEnd}
    >
      <iframe
        ref={iframeRef}
        src={SRC_MAP[animType]}
        onLoad={handleLoad}
        title="Result animation"
      />
      {skippable && !fading && (
        <button className="skip-btn" onClick={skip} type="button">
          Skip <kbd>Enter</kbd>
        </button>
      )}
    </div>
  );
}
