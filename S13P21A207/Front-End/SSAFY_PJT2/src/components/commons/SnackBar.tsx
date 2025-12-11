import React from 'react';
import { theme } from '../../styles/theme';

interface SnackbarProps {
  isVisible: boolean;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
}

const Snackbar: React.FC<SnackbarProps> = ({
  isVisible,
  message,
  onConfirm,
  confirmText = '확인',
}) => {
  return (
    <div 
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
        isVisible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-full opacity-0'
      }`}
    >
      <div className={`bg-${theme.myBlack} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-4 min-w-80`}>
        <span className="text-sm font-medium flex-1">{message}</span>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-sm font-medium rounded bg-${theme.primary} hover:bg-purple-700 transition-colors`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

export default Snackbar;
