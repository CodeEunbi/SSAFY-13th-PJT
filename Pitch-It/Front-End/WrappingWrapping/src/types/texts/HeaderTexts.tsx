import { theme } from '../../styles/theme';

export const headerTexts = {
  welcome: (nickname: string) => (
    <div className="flex hover:cursor-pointer">
      <span
        className={`text-${theme.primary} font-bold underline underline-offset-1
        inline-block flex-1 truncate`}
      >
        {nickname}
      </span>
      <span className="whitespace-nowrap"> 님, 환영합니다!</span>
    </div>
  ),

  myPage: '마이페이지',
  logout: '로그아웃',
  logoAlt: '로고 이미지',
  logoSrc: '/logo_text.png',
};
