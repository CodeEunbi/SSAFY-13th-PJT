// src/components/layout/videos/CameraOff.tsx

import CamOff from '../../../assets/icons/camOff.svg';

const CameraOff = () => {
  return (
    <div className="bg-zinc-900 w-full h-full flex flex-col items-center justify-center">
      <div className="w-8 h-8 flex items-center justify-center mb-1">
        <img src={CamOff} alt="Camera Off" className="w-4 h-4 brightness-200" />
      </div>
      <p className="text-xs text-my-light-grey">카메라 꺼짐</p>
    </div>
  );
};

export default CameraOff;
