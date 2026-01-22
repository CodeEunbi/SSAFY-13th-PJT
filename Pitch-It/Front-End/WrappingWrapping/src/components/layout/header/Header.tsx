import { FC } from 'react';
import { createPortal } from 'react-dom';
import Dropdown from './HeaderDropdown';
import { theme } from '../../../styles/theme';
import { headerTexts } from '../../../types/texts/HeaderTexts';
import { useDropdown } from '../../../hooks/useHeaderDropdown';
import { useNavigate } from 'react-router-dom';
import { AuthUtils } from '../../../utils/authUtils';
import FilledButton from '../../common/FilledButton';

import LogoText from '../../../assets/images/logo_text.png';

interface HeaderProps {
  nickname: string;
}

const Header: FC<HeaderProps> = ({ nickname }) => {
  const { isOpen, handleMouseEnter, handleMouseLeave } = useDropdown();
  const navigate = useNavigate();

  return (
    <div
      className={`sticky top-0 left-0 right-0 px-6 py-4 z-50 bg-${theme.myBlack} flex gap-14 justify-between items-center`}
    >
      {/* 로고 이미지 */}
      <div
        className="hover:cursor-pointer"
        onClick={() => {
          if (AuthUtils.isLoggedIn()) {
            // 로그인 상태인 경우 로고 클릭하면 메인으로
            navigate('/main');
          } else {
            // 비로그인 상태인 경우 로고 클릭하면 랜딩 페이지로
            navigate('/');
          }
        }}
      >
        <img
          src={LogoText}
          className="w-20 min-w-20"
          alt={headerTexts.logoAlt}
        />
      </div>

      {/* 로그인 상태에 따른 조건부 렌더링 */}
      {AuthUtils.isLoggedIn() ? (
        /* 로그인된 경우: 사용자 닉네임 및 드롭다운 */
        <div
          className="py-4 px-4 -m-4 overflow-x-hidden hover:cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {headerTexts.welcome(nickname)}
        </div>
      ) : (
        /* 비로그인 경우: 로그인/회원가입 버튼 */
        <div className="py-4 px-4 -m-4 flex gap-3 items-center">
          {/* <span
            className={`text-${theme.primary} hover:cursor-pointer hover:underline mr-2`}
            onClick={() => navigate('/login')}
          >
            로그인
          </span> */}
          <FilledButton
            label="로그인"
            onClick={() => navigate('/login')}
            size="px-3"
          />
        </div>
      )}

      {/* Portal로 body에 드롭다운 렌더링 (로그인된 경우에만) */}
      {/* overflow-hidden에 가려지지 않도록 하기 위해 body에 바로 넣는 것 */}
      {AuthUtils.isLoggedIn() &&
        isOpen &&
        createPortal(
          <div
            // 닉네임과 별개로 드롭다운도 호버 이벤트를 적용하여 닫히지 않도록 함
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Dropdown isVisible={isOpen} />
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Header;
