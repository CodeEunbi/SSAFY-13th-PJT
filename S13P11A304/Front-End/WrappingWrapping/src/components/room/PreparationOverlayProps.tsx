// src/components/room/PreparationOverlay.tsx
import React, { useState, useEffect } from 'react';

interface PreparationOverlayProps {
  endTime: string;
  onComplete: () => void;
  isMyTurn: boolean;
}

export const PreparationOverlay: React.FC<PreparationOverlayProps> = ({
  endTime,
  onComplete,
  isMyTurn,
}) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const end = new Date(endTime).getTime();
      const remaining = Math.max(0, Math.ceil((end - now) / 1000));

      setTimeLeft(remaining);

      if (remaining <= 0) {
        onComplete();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  if (!isMyTurn) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">다음 발표자 준비 중</h2>
          <div className="text-4xl ">{timeLeft}</div>
          <p className="text-gray-600 mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">발표를 준비해주세요</h2>
        <div className="text-6xl text-watermelon mb-4">{timeLeft}</div>
        <p className="text-gray-600">곧 발표가 시작됩니다</p>
      </div>
    </div>
  );
};
