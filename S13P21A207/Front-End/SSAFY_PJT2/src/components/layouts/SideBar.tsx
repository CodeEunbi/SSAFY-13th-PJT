import React from 'react';
import logo from '../../assets/icons/logo.png';
import { theme } from '../../styles/theme';

interface SideBarProps {
  selectedMenu?: string;
  onMenuClick?: (menu: string) => void;
}

const SideBar: React.FC<SideBarProps> = ({
  selectedMenu = '일반',
  onMenuClick,
}) => {
  const menuItems = ['일반', '필터링 설정', '가이드'];

  return (
    <div
      className={`w-80 h-screen flex flex-col bg-${theme.myLightGrey} fixed left-0 top-0`}
    >
      {/* 헤더 섹션 */}
      <div
        className={`p-4 pt-10 flex items-center justify-center bg-${theme.myLightGrey}`}
      >
        <img src={logo} alt="지킴앤하이드 로고" className="w-12 h-12 mr-3" />
        <span className={`font-bold text-4xl text-${theme.primary}`}>
          지킴앤하이드
        </span>
      </div>

      {/* 메뉴 아이템들 */}
      <div className="flex-1 pt-8">
        {menuItems.map((item) => (
          <div
            key={item}
            className={`px-6 py-4 cursor-pointer transition-colors ${
              selectedMenu === item
                ? `bg-${theme.myWhite} text-${theme.myBlack}`
                : `bg-${theme.myLightGrey} text-${theme.myBlack} hover:bg-${theme.myWhite}`
            }`}
            onClick={() => onMenuClick?.(item)}
          >
            <span className="font-semibold text-lg">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SideBar;
