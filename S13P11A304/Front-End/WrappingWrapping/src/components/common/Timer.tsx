// src/components/common/Timer.tsx
import { useEffect, useState } from 'react';

interface TimerProps {
  endTime: string | null;
  onExpire?: () => void; // 만료 시 콜백
}

const Timer = ({ endTime, onExpire }: TimerProps) => {
  const [minute, setMinute] = useState<number | null>(null);
  const [second, setSecond] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endTime) return;

    let hasExpired = false;

    const updateTimer = () => {
      const currentTime = new Date().getTime();
      const targetTime = new Date(endTime).getTime();
      const timeRemain = Math.floor((targetTime - currentTime) / 1000);

      if (timeRemain <= 0 && !hasExpired) {
        hasExpired = true;
        setMinute(0);
        setSecond(0);
        setIsExpired(true);
        onExpire?.(); // 만료 즉시 콜백 실행
        return;
      }

      if (timeRemain > 0) {
        const minuteRemaining = Math.floor(timeRemain / 60);
        const secondRemaining = timeRemain % 60;
        setMinute(minuteRemaining);
        setSecond(secondRemaining);
        setIsExpired(false);
      }
    };

    // 즉시 한 번 실행
    updateTimer();

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  return (
    <div>
      {minute !== null && second !== null ? (
        <span>
          {isExpired
            ? '00:00'
            : `${minute < 10 ? '0' : ''}${minute}:${second < 10 ? '0' : ''}${second}`}
        </span>
      ) : (
        <span>계산 중</span>
      )}
    </div>
  );
};

export default Timer;
