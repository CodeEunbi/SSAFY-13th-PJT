import { useState } from 'react';

export default function Demo() {
  const [activeTab, setActiveTab] = useState(0);

  const demos = [
    {
      title: 'ERD 편집 화면',
      description: 'AI가 생성한 ERD를 실시간으로 편집하고 팀원들과 협업하세요',
      image:
        'https://readdy.ai/api/search-image?query=Modern%20data%20modeling%20interface%20showing%20entity%20relationship%20diagram%20with%20clean%20white%20background%2C%20multiple%20connected%20database%20tables%20with%20blue%20accent%20colors%2C%20professional%20software%20design%20tool%20interface%2C%20minimalist%20UI%20with%20light%20blue%20theme%2C%20collaborative%20cursors%20visible%20on%20canvas%2C%20sleek%20and%20modern%20design%20aesthetic&width=1200&height=700&seq=demo1&orientation=landscape',
    },
    {
      title: '실시간 협업',
      description:
        '팀원들의 커서와 변경사항을 실시간으로 확인하며 함께 작업합니다',
      image:
        'https://readdy.ai/api/search-image?query=Collaborative%20workspace%20showing%20multiple%20user%20cursors%20on%20database%20design%20canvas%2C%20real-time%20editing%20indicators%20with%20blue%20and%20cyan%20highlights%2C%20modern%20team%20collaboration%20interface%2C%20clean%20white%20background%20with%20light%20blue%20accents%2C%20professional%20software%20collaboration%20tool%2C%20minimalist%20design%20with%20floating%20user%20avatars&width=1200&height=700&seq=demo2&orientation=landscape',
    },
    {
      title: '버전 비교',
      description: '이전 버전과 현재 버전을 비교하고 필요시 복원할 수 있습니다',
      image:
        'https://readdy.ai/api/search-image?query=Version%20comparison%20interface%20showing%20side-by-side%20database%20schema%20differences%2C%20highlighted%20changes%20in%20blue%20and%20cyan%20colors%2C%20clean%20white%20background%2C%20professional%20diff%20view%20with%20modern%20UI%20design%2C%20minimalist%20version%20control%20interface%2C%20clear%20visual%20indicators%20of%20modifications&width=1200&height=700&seq=demo3&orientation=landscape',
    },
    {
      title: 'AI 결과 패널',
      description: 'AI가 분석한 최적화 제안과 검증 결과를 확인하세요',
      image:
        'https://readdy.ai/api/search-image?query=AI%20analysis%20panel%20showing%20optimization%20suggestions%20for%20database%20design%2C%20clean%20interface%20with%20blue%20gradient%20accents%2C%20white%20background%20with%20light%20blue%20highlights%2C%20modern%20AI%20assistant%20interface%2C%20professional%20recommendation%20cards%2C%20minimalist%20design%20with%20clear%20typography%20and%20icons&width=1200&height=700&seq=demo4&orientation=landscape',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            ERD는 더 이상 복잡한 다이어그램이 아닙니다.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI와 함께하는 설계 캔버스입니다.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {demos.map((demo, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                activeTab === index
                  ? 'bg-blue text-white shadow-lg scale-105'
                  : 'bg-light-blue text-gray-600 border-2 border-blue-200 hover:border-blue-400'
              }`}
            >
              {demo.title}
            </button>
          ))}
        </div>

        {/* Demo Content */}
        <div className="relative">
          {demos.map((demo, index) => (
            <div
              key={index}
              className={`transition-all duration-500 ${
                activeTab === index
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'
              }`}
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-blue-100">
                {/* Browser Chrome */}
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                  </div>
                  <div className="flex-1 bg-white rounded-lg px-4 py-1 text-sm text-gray-500 ml-4">
                    yaldi.app/{demo.title.toLowerCase().replace(/\s+/g, '-')}
                  </div>
                </div>

                {/* Screenshot */}
                <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-cyan-50">
                  <img
                    src={demo.image}
                    alt={demo.title}
                    className="w-full h-full object-cover object-top"
                  />

                  {/* Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {demo.title}
                    </h3>
                    <p className="text-blue-100">{demo.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
