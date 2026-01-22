import React from 'react';
import { theme } from '../../styles/theme';

interface ToggleButtonProps {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  isOn,
  onToggle,
  disabled = false,
  className = '',
}) => {
  const currentSize = { width: '40px', height: '24px', thumb: '17px' };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      style={{
        width: currentSize.width,
        height: currentSize.height,
      }}
      className={`
        relative rounded-full border-none transition-all duration-200 ease-in-out
        ${isOn ? `bg-${theme.primary}` : `bg-${theme.myToggleGrey}`}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}  
        ${className}
      `}
      role="switch"
      aria-checked={isOn}
      aria-label={isOn ? '켜짐' : '꺼짐'}
    >
      <span
        style={{
          width: currentSize.thumb,
          height: currentSize.thumb,
          position: 'absolute',
          top: '50%',
          left: isOn 
            ? `calc(100% - ${currentSize.thumb} - 3px)` 
            : '3px',
          transform: 'translateY(-50%)',   // 토글버튼 중앙 정렬
        }}
        className={`
          rounded-full absolute transition-all duration-200 ease-in-out shadow-sm
          ${isOn ? `bg-${theme.myToggleOnGrey}` : `bg-${theme.myToggleOffGrey}`}
        `}
      />
    </button>
  );
};

export default ToggleButton;