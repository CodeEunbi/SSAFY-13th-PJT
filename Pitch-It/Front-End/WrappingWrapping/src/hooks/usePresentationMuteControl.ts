import { useEffect, useRef } from 'react';
import { Room } from 'livekit-client';

interface UsePresentationMuteControlProps {
  room: Room | null;
  isConnected: boolean;
  currentPresenter: string | null;
  myKey: string;
  showRequirements: boolean;
  order: string[];
  currentPresenterIndex: number;
}

export const usePresentationMuteControl = ({
  room,
  isConnected,
  currentPresenter,
  myKey,
  showRequirements,
  order,
  currentPresenterIndex,
}: UsePresentationMuteControlProps) => {
  const previousMicStateRef = useRef<boolean | null>(null);
  const isMyTurn = currentPresenter === myKey;
  const isLastPresenter = currentPresenterIndex >= order.length - 1;

  useEffect(() => {
    if (!room || !isConnected || showRequirements) return;

    const handlePresentationMute = async () => {
      try {
        if (isMyTurn) {
          // 내 차례: 이전 상태가 저장되어 있다면 복원, 없으면 음소거 해제
          if (previousMicStateRef.current !== null) {
            await room.localParticipant.setMicrophoneEnabled(
              previousMicStateRef.current,
            );
            console.log(
              '🔊 발표자 차례: 마이크 상태 복원:',
              previousMicStateRef.current,
            );
            previousMicStateRef.current = null;
          } else {
            await room.localParticipant.setMicrophoneEnabled(true);
            console.log('🔊 발표자 차례: 마이크 활성화');
          }
        } else {
          // 다른 사람 차례: 현재 마이크 상태 저장 후 음소거
          const currentMicState = room.localParticipant.isMicrophoneEnabled;
          if (previousMicStateRef.current === null) {
            previousMicStateRef.current = currentMicState;
            console.log(
              '🔇 청중 차례: 마이크 상태 저장 후 음소거, 저장된 상태:',
              currentMicState,
            );
          }
          await room.localParticipant.setMicrophoneEnabled(false);
        }
      } catch (error) {
        console.error('❌ 발표 음소거 제어 실패:', error);
      }
    };

    handlePresentationMute();
  }, [room, isConnected, isMyTurn, showRequirements]);

  // 모든 발표가 끝났을 때 음소거 해제
  useEffect(() => {
    if (!room || !isConnected || showRequirements) return;

    const handleAllPresentationsEnd = async () => {
      if (isLastPresenter && !isMyTurn) {
        try {
          // 저장된 상태로 복원하거나 음소거 해제
          const restoreState =
            previousMicStateRef.current !== null
              ? previousMicStateRef.current
              : true;
          await room.localParticipant.setMicrophoneEnabled(restoreState);
          console.log(
            '🎉 모든 발표 종료: 마이크 상태 복원/활성화:',
            restoreState,
          );
          previousMicStateRef.current = null;
        } catch (error) {
          console.error('❌ 발표 종료 후 마이크 복원 실패:', error);
        }
      }
    };

    handleAllPresentationsEnd();
  }, [room, isConnected, isLastPresenter, isMyTurn, showRequirements]);

  return {
    isMyTurn,
    isLastPresenter,
    previousMicState: previousMicStateRef.current,
  };
};
