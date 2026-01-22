/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{html,js,ts,jsx,tsx}'],
  safelist: [
    'bg-my-black',
    'bg-purple', // 682A8D, 메인 보라
    'bg-box-grey', // F9F9F9, 박스
    'bg-light-grey', // ECECEC, 사이드바
    'bg-my-grey', // 747474, 연한 글씨
    'bg-mid-grey', // B8B3B3, 탭
    'bg-my-white/50', // FFFFFF, 사이드바 선택될 때
    'bg-toggle-grey', // 969397, 토글 껐을 때
    'bg-toggle-off-grey', // DADADA, 토글 껐을 때 원
    'bg-toggle-on-grey', // F3F3F3, 토글 켰을 때 원

    'text-my-black',
    'text-my-grey',
    'text-purple',

    'border-line-grey', //D6D6D6, 선
    'border-mid-grey', // B8B3B3, 탭
  ],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ['Pretendard', 'sans-serif'],
      },
      colors: {
        purple: '#682A8D',
        'my-black': '#303030',
        'box-grey': '#F9F9F9',
        'light-grey': '#ECECEC',
        'my-grey': '#747474',
        'mid-grey': '#B8B3B3',
        'my-white': '#FFFFFF',
        'line-grey': '#D6D6D6',
        'toggle-grey': '#969397',
        'toggle-on-grey': '#F3F3F3',
        'toggle-off-grey': '#DADADA',
      },
    },
  },
  plugins: [],
};
