// src/pages/Error.tsx

import React from 'react';
import { theme } from '../styles/theme';

interface ErrorScreenProps {
  error: string;
  onBack: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onBack }) => {
  return (
    <div
      className={`min-h-screen w-full bg-${theme.myBlack} text-${theme.myWhite} flex flex-col items-center justify-center`}
    >
      <div className="text-xl mb-4">오류가 발생했습니다</div>
      <div className="text-red-400 mb-6 text-center px-4">{error}</div>
      <button
        onClick={onBack}
        className={`bg-${theme.primary} text-${theme.myBlack} px-6 py-2 rounded-lg hover:opacity-90 transition-opacity`}
      >
        돌아가기
      </button>
    </div>
  );
};
