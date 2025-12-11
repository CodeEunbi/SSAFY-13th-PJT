import { useEffect } from 'react';
import FilledButton from './FilledButton';
import LinedButton from './LinedButton';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** 확인 버튼만 보이게 하고 싶을 때 true */
  hideCancel?: boolean;
}

export default function WithdrawModal({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  message,
  confirmText = '예',
  cancelText = '아니오',
  hideCancel = false,
}: WithdrawModalProps) {
  // ESC 닫기 + 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // body 스크롤 잠금
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // message가 비어 문자열로 올 수도 있으니 트리밍 체크
  const hasMessage =
    typeof message === 'string' ? message.trim().length > 0 : !!message;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose} // 백드롭 클릭 닫기
    >
      <div
        className="bg-my-black rounded-2xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()} // 내부 클릭은 닫기 방지
      >
        <div className="text-center">
          <h3 className="text-my-white text-lg font-semibold mb-6">{title}</h3>

          {hasMessage && (
            // 줄바꿈(\n) 표시되도록
            <p className="text-my-white text-sm mb-6 whitespace-pre-line">
              {message}
            </p>
          )}

          <div className={`flex ${hideCancel ? '' : 'gap-3'}`}>
            <FilledButton
              label={confirmText}
              onClick={onConfirm}
              size="w-full py-2"
            />
            {/* alert 스타일일 때 취소 숨김 */}
            {!hideCancel && (
              <LinedButton
                label={cancelText}
                onClick={onClose}
                size="w-full py-2"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
