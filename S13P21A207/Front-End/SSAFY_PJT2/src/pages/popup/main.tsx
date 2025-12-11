import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import ToggleButton from '../../components/commons/ToggleButton';
import logoImage from '../../assets/icons/logo.png';
import {
  getSettings,
  updateSettings,
  initSettings,
} from '../../utils/settings';

function Popup() {
  const [isOverallOn, setIsOverallOn] = useState(true);
  const [textCount] = useState(100);
  const [imageCount] = useState(50);

  // 설정 로드
  useEffect(() => {
    (async () => {
      try {
        await initSettings(); 
        const settings = await getSettings();
        setIsOverallOn(settings.serviceEnabled !== false);
      } catch (error) {
        console.error('설정 로드 실패:', error);
      }
    })();
  }, []);

  const handleSettingsClick = () => chrome.runtime.openOptionsPage();

  const handleOverallToggle = async () => {
    const newState = !isOverallOn;
    setIsOverallOn(newState);

    try {
      // utils 통해 저장 (serviceEnabled 사용)
      await updateSettings({ serviceEnabled: newState });
      console.log('전체 ON/OFF(serviceEnabled) 저장:', newState);
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  };

  return (
    <div className="w-full h-full bg-white p-4 flex flex-col relative min-h-[250px]">
      {/* 설정 버튼 */}
      <button
        onClick={handleSettingsClick}
        className="absolute top-2 right-2 p-1 z-10"
      >
        <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
      </button>

      {/* 상단 여백 */}
      <div className="h-3"></div>

      {/* 로고 */}
      <div className="flex justify-center items-center mb-2">
        <img src={logoImage} alt="로고" className="w-14 h-14" />
      </div>

      {/* 전체 ON/OFF */}
      <div className="flex items-center justify-center mb-2">
        <span className="text-lg font-medium text-my-black mr-3">
          전체 ON/OFF
        </span>
        <ToggleButton isOn={isOverallOn} onToggle={handleOverallToggle} />
      </div>

      {/* 통계 박스들 */}
      <div className="flex-1 grid place-items-center">
        <div className="flex gap-4">
          <div className="w-32 bg-light-grey rounded-lg p-4 text-center">
            <div className="text-my-black text-base mb-1">텍스트</div>
            <div className="text-my-black text-sm">{textCount}자</div>
          </div>
          <div className="w-32 bg-light-grey rounded-lg p-4 text-center">
            <div className="text-my-black text-base mb-1">이미지</div>
            <div className="text-my-black text-sm">{imageCount}개</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Popup;

createRoot(document.getElementById('root')!).render(<Popup />);
