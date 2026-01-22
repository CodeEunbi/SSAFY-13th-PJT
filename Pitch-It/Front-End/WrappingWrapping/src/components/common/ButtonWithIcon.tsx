// src/components/common/ButtonWithIcon.tsx

import React from 'react';

interface ButtonWithIconProps {
  children: React.ReactNode;
  onClick: () => void;
  size?: string;
}

const ButtonWithIcon = ({ children, onClick, size }: ButtonWithIconProps) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-2 rounded-full cursor-pointer bg-watermelon`}
    >
      <span className={`${size}`}>{children}</span>
    </div>
  );
};

export default ButtonWithIcon;
