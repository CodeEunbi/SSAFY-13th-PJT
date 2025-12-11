/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'bg-my-black',
    'bg-my-white',
    'bg-watermelon',
    'bg-my-light-grey',
    'bg-google-neutral',
    'bg-google-dark',

    'hover:bg-watermelon',
    'hover:bg-watermelon-light',

    'ring-watermelon',

    'text-my-light-grey',
    'text-my-black',
    'text-my-white',
    'text-watermelon',

    'border-my-black',
    'border-my-white',
    'border-my-light-grey',
    'border-watermelon',

    'focus:ring-watermelon',
  ],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ['Pretendard', 'sans-serif'],
      },
      colors: {
        watermelon: '#FC6C86',
        'watermelon-light': '#FF91A5',
        'my-black': '#303030',
        'my-white': '#F0F0F0',
        'my-light-grey': '#cccccc',
        'google-neutral': '#F2F2F2',
        'google-dark': '#131314',
      },
    },
  },
  plugins: [],
};
