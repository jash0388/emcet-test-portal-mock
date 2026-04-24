import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

interface ExamTimerProps {
  durationSeconds: number;
  onExpire: () => void;
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

export function ExamTimer({ durationSeconds, onExpire }: ExamTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const expiredRef = useRef(false);

  useEffect(() => {
    setSecondsLeft(durationSeconds);
    expiredRef.current = false;
  }, [durationSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const className =
    secondsLeft < 60
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : secondsLeft < 300
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div
      className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-mono font-black border ${className}`}
    >
      <Clock className="w-4 h-4" />
      <span>{formatTime(secondsLeft)}</span>
    </div>
  );
}
