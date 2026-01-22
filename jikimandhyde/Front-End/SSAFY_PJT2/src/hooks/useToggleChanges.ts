import { useState, useCallback } from 'react';

interface PendingChange {
  key: string;
  value: any;
  originalValue: any;
  onConfirm: () => void;
}

export const useToggleChanges = () => {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [showSnackbar, setShowSnackbar] = useState(false);

  const addPendingChange = useCallback((
    key: string,
    newValue: any,
    originalValue: any,
    onConfirm: () => void
  ) => {
    // 기존에 같은 키의 변경사항이 있다면 제거
    setPendingChanges(prev => 
      prev.filter(change => change.key !== key)
    );
    
    // 원래 상태와 같다면 스낵바를 표시하지 않음
    if (newValue === originalValue) {
      setShowSnackbar(false);
      return;
    }
    
    // 새로운 변경사항 추가
    setPendingChanges(prev => [
      ...prev,
      {
        key,
        value: newValue,
        originalValue,
        onConfirm,
      }
    ]);
    
    setShowSnackbar(true);
  }, []);

  const confirmChanges = useCallback(() => {
    // 모든 대기 중인 변경사항을 확인
    pendingChanges.forEach(change => {
      change.onConfirm();
    });
    
    // 상태 초기화
    setPendingChanges([]);
    setShowSnackbar(false);
  }, [pendingChanges]);

  const getSnackbarMessage = useCallback(() => {
    if (pendingChanges.length === 0) return '';
    
    return `설정을 변경하시겠습니까?`;
  }, [pendingChanges]);

  return {
    showSnackbar,
    pendingChangesCount: pendingChanges.length,
    addPendingChange,
    confirmChanges,
    getSnackbarMessage,
  };
};
