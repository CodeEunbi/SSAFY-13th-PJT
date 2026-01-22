import { FC } from 'react';
import { theme } from '../../../styles/theme';

interface HeaderDropdownItemProps {
  children?: React.ReactNode;
  onClick?: () => void;
}

const HeaderDropdownItem: FC<HeaderDropdownItemProps> = ({
  children,
  onClick,
}) => {
  return (
    <div className={`bg-${theme.myBlack}`}>
      <div
        onClick={onClick}
        className={`py-3 px-6
			hover:bg-${theme.primary} hover:bg-opacity-20 hover:cursor-pointer`}
      >
        {children}
      </div>
    </div>
  );
};

export default HeaderDropdownItem;
