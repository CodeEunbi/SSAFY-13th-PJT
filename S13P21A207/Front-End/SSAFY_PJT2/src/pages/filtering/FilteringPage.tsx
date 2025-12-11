import React, { useState } from 'react';
import ImageFiltering from './ImageFiltering';
import TextFiltering from './TextFiltering';
import { theme } from '../../styles/theme';

const FilteringPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');

  return (
    <div className="max-w-6xl">
      <h2 className="text-3xl font-bold mb-8 text-my-black pb-3">
        필터링 설정
      </h2>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-8 mb-8">
        <button
          onClick={() => setActiveTab('image')}
          className={`text-lg font-semibold pb-2 transition-colors ${
            activeTab === 'image'
              ? `text-${theme.myBlack} border-b-4 border-${theme.myMidGrey}`
              : `text-${theme.myGrey} hover:text-${theme.myBlack}`
          }`}
        >
          이미지 설정
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`text-lg font-semibold pb-2 transition-colors ${
            activeTab === 'text'
              ? `text-${theme.myBlack} border-b-4 border-${theme.myMidGrey}`
              : `text-${theme.myGrey} hover:text-${theme.myBlack}`
          }`}
        >
          텍스트 설정
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white rounded-lg border-t-0">
        {activeTab === 'image' && <ImageFiltering />}
        {activeTab === 'text' && <TextFiltering />}
      </div>
    </div>
  );
};

export default FilteringPage;
