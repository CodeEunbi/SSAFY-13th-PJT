// src/components/room/RoomExitModal.tsx

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import LinedButton from '../common/LinedButton';
import FilledButton from '../common/FilledButton';

interface RoomExitModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

const RoomExitModal = ({
  isOpen,
  onConfirm,
  onCancel,
  message = '회의를 나가시겠습니까?\n다시 진입할 수 없습니다.',
}: RoomExitModalProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    },
    [onConfirm, onCancel],
  );

  useEffect(() => {
    if (!isOpen) return; // 모달이 열려있을 때만 이벤트 리스너 추가

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-my-black rounded-2xl p-8 w-[350px] mx-4 shadow-2xl">
        {/* 제목 */}
        <h2 className="text-lg font-semibold mb-6 text-center">회의 나가기</h2>

        {/* 메시지 */}
        <p className="text-sm text-center mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* 버튼들 */}
        <div className="flex gap-4 justify-center">
          <LinedButton
            label="취소"
            onClickEvent={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            size="w-full py-1"
          />
          <FilledButton
            label="나가기"
            onClickEvent={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onConfirm();
            }}
            size="w-full py-1"
          />
        </div>
      </div>
    </div>
  );

  // Portal을 사용하여 body에 직접 렌더링
  return createPortal(modalContent, document.body);
};

export default RoomExitModal;
