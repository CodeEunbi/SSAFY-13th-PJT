// src\pages\Loading.tsx

// import { useState, useEffect } from 'react';

import LogoImage from '../assets/images/logo_image.png';

const Loading = () => {
  // const dots = ['.', '..', '...'];
  // const [currentIndex, setCurrentIndex] = useState(0);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentIndex((prev) => (prev + 1) % dots.length);
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-col items-center justify-center h-full">
        <div className="flex flex-col items-center sm:items-center sm:flex-row py-12 gap-4 w-full justify-center">
          {/* <img
            src={`/src/assets/icons/loadingSpinner.svg`}
            className="max-w-[200px]"
            alt="Loading Spinner Icon"
          ></img> */}
          <img
            src={LogoImage}
            alt="로고 이미지"
            className="w-[120px] sm:w-[100px] animate-pulse"
          ></img>
          <h1
            className="flex flex-col items-center sm:items-start justify-center
            text-3xl font-thin sm:mt-4"
          >
            잠시만 기다려주세요
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Loading;
