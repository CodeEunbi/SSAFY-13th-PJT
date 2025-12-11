// src/components/layout/videos/RoomHeader.tsx

import React from 'react';
import { LogOut } from 'lucide-react';
import { theme } from '../../../styles/theme';

interface RoomHeaderProps {
  timer?: string;
  onExit: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  timer = '00:00',
  onExit,
}) => {
  return (
    <>
      <div
        className={`left-5 top-5 fixed bg-${theme.primary} text-${theme.myBlack} font-extrabold px-4 py-1 rounded-full text-xl tracking-widest`}
      >
        {timer}
      </div>
      <button
        className={`right-5 top-5 fixed bg-${theme.primary} p-3 rounded-full`}
        onClick={onExit}
      >
        <LogOut className={`text-${theme.myBlack} w-6 h-6`} strokeWidth={2.5} />
      </button>
    </>
  );
};
