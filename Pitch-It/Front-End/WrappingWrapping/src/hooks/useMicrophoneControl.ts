// src/hooks/useMicrophoneControl.ts

import { useState, useEffect } from 'react';
import { Room } from 'livekit-client';

interface UseMicrophoneControlProps {
  room: Room | null;
  isConnected: boolean;
  showRequirements: boolean;
  isMicOn: boolean;
}

export const useMicrophoneControl = ({
  room,
  isConnected,
  showRequirements,
  isMicOn,
}: UseMicrophoneControlProps) => {
  const [micStateBeforeRequirements, setMicStateBeforeRequirements] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    if (!room || !isConnected) return;

    const handleRequirementsDisplay = async () => {
      try {
        if (showRequirements && micStateBeforeRequirements === null) {
          // 요구사항 화면 시작: 현재 마이크 상태 저장 후 음소거
          setMicStateBeforeRequirements(isMicOn);
          await room.localParticipant.setMicrophoneEnabled(false);
          console.log(
            '🔇 요구사항 화면 시작: 마이크 음소거, 이전 상태 저장:',
            isMicOn,
          );
        } else if (!showRequirements && micStateBeforeRequirements !== null) {
          // 요구사항 화면 종료: 저장된 상태로 복원
          await room.localParticipant.setMicrophoneEnabled(
            micStateBeforeRequirements,
          );
          console.log(
            '🔊 요구사항 화면 종료: 마이크 상태 복원:',
            micStateBeforeRequirements,
          );
          setMicStateBeforeRequirements(null);
        }
      } catch (error) {
        console.error('❌ 요구사항 화면 마이크 처리 실패:', error);
      }
    };

    handleRequirementsDisplay();
  }, [
    room,
    isConnected,
    showRequirements,
    isMicOn,
    micStateBeforeRequirements,
  ]);

  return {
    micStateBeforeRequirements,
  };
};
