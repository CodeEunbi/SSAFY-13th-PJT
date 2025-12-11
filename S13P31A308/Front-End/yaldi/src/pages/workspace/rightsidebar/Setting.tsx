import React from 'react';
import SettingIcon from '../../../assets/icons/setting_icon.svg?react';

type SettingProps = {
  onClick?: () => void;
  isActive?: boolean;
};

const Setting: React.FC<SettingProps> = ({ onClick, isActive }) => {
  const buttonClasses = `w-8 h-8 flex items-center justify-center mt-2 mb-2 rounded transition-colors hover:bg-ai-chat ${
    isActive ? 'bg-ai-chat' : 'bg-transparent'
  }`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonClasses}
      aria-label="설정"
    >
      <SettingIcon className="w-5 h-5 text-my-black" />
    </button>
  );
};

export default Setting;
