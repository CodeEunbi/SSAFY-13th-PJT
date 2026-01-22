import { useState, useCallback, useRef } from 'react';

export const useDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // 타임아웃 제거
  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 호버 시 드롭다운 표시
  const handleMouseEnter = useCallback(() => {
    clearTimeoutRef();
    setIsOpen(true);
  }, [clearTimeoutRef]);

  // 호버 아웃 시 드롭다운 숨김 - 시간차를 두어 마우스가 드롭다운으로 이동할 수 있도록 함
  const handleMouseLeave = useCallback(() => {
    clearTimeoutRef();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, [clearTimeoutRef]);

  return {
    isOpen,
    handleMouseEnter,
    handleMouseLeave,
  };
};
