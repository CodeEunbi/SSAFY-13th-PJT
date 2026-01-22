import React from 'react';
import { theme } from '../../styles/theme';
import imgFilteringExample from '../../assets/images/imgfiltering.png';

const GuidePage: React.FC = () => {
  return (
    <div className="max-w-6xl">
      <h2 className="text-3xl font-bold mb-8 text-my-black pb-3">가이드</h2>

      {/* 0. 서비스 설명 */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-6 text-my-black border-b-2 border-my-line-grey pb-2">
          0. 서비스 설명
        </h3>
        <div
          className={`p-8 rounded-3xl bg-${theme.myBoxGrey} space-y-4 text-base text-my-black`}
        >
          <p>
            인터넷을 사용할 때 원치 않는 정보에 노출되는 경우가 자주 발생합니다.
            개인적인 기호나 트라우마로 인해 보고 싶지 않은 콘텐츠가 있을 수
            있으며, 이는 웹 서핑의 편안함과 심리적 안정감을 저해할 수 있습니다.
          </p>
          <p>
            지킴앤 하이드는 사용자가 선택한 주제와 AI 기반 필터링을 통해
            텍스트와 이미지를 감지하여 가려줌으로써, 보다 안전하고 쾌적한 인터넷
            환경을 제공합니다. AI 기술을 활용해 불필요한 콘텐츠를 정확하고
            유연하게 차단하며, 사용자는 필요에 따라 원본을 확인할 수도 있습니다.
          </p>
          <p>
            이를 통해 누구나 자신에게 적합한 맞춤형 웹 서핑 환경을 경험할 수
            있습니다.
          </p>
        </div>
      </div>

      {/* 1. 일반 설정 */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-6 text-my-black border-b-2 border-line-grey pb-2">
          1. 일반 설정
        </h3>
        <div className={`p-8 rounded-3xl bg-${theme.myBoxGrey}`}>
          <ul className="space-y-2 text-base text-my-black">
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-my-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>
                동기화 설정 : 여러 기기에서 동일한 필터링 설정을 유지할 수
                있습니다.
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-my-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>
                필터링 활성화 : 전체 필터링 기능을 일괄적으로 켜거나 끌 수
                있어야 합니다.
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-my-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>
                아이콘 버튼에서는 사용법 확인, 설정 이동, 아이콘 숨기기가
                가능합니다.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 2. 필터링 설정 */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-6 text-my-black border-b-3 border-my-line-grey pb-2">
          2. 필터링 설정
        </h3>

        {/* 2-1. 이미지 필터링 설정 */}
        <div className="mb-8">
          <h4 className="text-xl font-bold mb-6 text-my-black border-b-2 border-my-line-grey pb-2">
            2-1. 이미지 필터링 설정
          </h4>
          <div className={`p-8 rounded-3xl bg-${theme.myBoxGrey} mb-8`}>
            <ul className="space-y-2 text-base text-my-black">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-my-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>
                  이미지 필터링 설정: 이미지 차단 기능을 활성화합니다.
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-my-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>
                  클릭 시 원본 보기 : 가려진 이미지를 클릭하면 원본을 확인할 수
                  있습니다.
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-my-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>
                  범죄, 사건사고, 공포, 고어, 성적인 컨텐츠와 같은 카테고리별
                  필터링이 가능합니다.
                </span>
              </li>
            </ul>
          </div>

          {/* 이미지 필터링 예시 */}
          <div className="flex items-center justify-center space-x-6 mb-6">
            {/* 원본 이미지 */}
            <div className="w-64 h-40 rounded-lg overflow-hidden">
              <img
                src={imgFilteringExample}
                alt="원본 이미지"
                className="w-full h-full object-cover"
              />
            </div>

            {/* 화살표 */}
            <div className="text-3xl text-my-black font-bold">→</div>

            {/* 필터링된 결과 */}
            <div
              className={`w-64 h-40 bg-${theme.myLightGrey} rounded-lg flex items-center justify-center`}
            >
              <span className="text-my-black text-base text-center px-2">
                공포 콘텐츠가 감지되어
                <br />
                필터링이 됐습니다.
              </span>
            </div>
          </div>
        </div>

        {/* 2-2. 텍스트 필터링 설정 */}
        <div>
          <h4 className="text-xl font-bold mb-6 text-my-black border-b-2 border-my-line-grey pb-2">
            2-2. 텍스트 필터링 설정
          </h4>
          <div className={`p-8 rounded-3xl bg-${theme.myBoxGrey} mb-8`}>
            <ul className="space-y-2 text-base text-my-black">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-my-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>
                  텍스트 필터링 설정: 텍스트 차단 기능을 활성화합니다.
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-my-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>
                  클릭 시 원본보기 : 가려진 텍스트를 클릭하면 원문 확인이
                  가능합니다.
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-my-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>단어 가리기 : 단어를 숨김 처리합니다.</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-my-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>
                  욕설 및 비난, 정치, 광고 및 봇, 성적인 컨텐츠와 같은 테고리별
                  필터링이 가능합니다.
                </span>
              </li>
            </ul>
          </div>

          {/* 텍스트 필터링 예시 */}
          <div className="flex items-center justify-center space-x-6 mb-6">
            {/* 원본 텍스트 */}
            <div
              className={`w-64 h-40 bg-${theme.myLightGrey} rounded-lg flex items-center justify-center p-4`}
            >
              <span className="text-my-black text-base text-center">
                #@!$&하고 "(&!@#^%하네
              </span>
            </div>

            {/* 화살표 */}
            <div className="text-3xl text-my-black font-bold">→</div>

            {/* 필터링된 결과 */}
            <div
              className={`w-64 h-40 bg-${theme.myLightGrey} rounded-lg flex items-center justify-center p-4`}
            >
              <span className="text-my-black text-base text-center">
                욕설로 감지되어
                <br />
                필터링이 됐습니다
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidePage;
