export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: '요구사항 입력',
      description: '프로젝트 설명 또는 텍스트 요구사항을 간단히 입력하세요',
      detail:
        'AI가 이해할 수 있는 자연어로 프로젝트의 요구사항을 작성하면, YALDI가 자동으로 분석을 시작합니다.',
      icon: 'ri-edit-line',
      color: 'from-blue to-cyan-500',
      image:
        'https://readdy.ai/api/search-image?query=Modern%20minimalist%20interface%20showing%20a%20clean%20text%20editor%20with%20project%20requirements%20being%20typed%2C%20soft%20blue%20and%20white%20color%20scheme%2C%20professional%20UI%20design%2C%20floating%20input%20fields%20with%20subtle%20shadows%2C%20clean%20workspace%20aesthetic&width=1200&height=600&seq=howitworks1&orientation=landscape',
    },
    {
      number: '02',
      title: 'AI 초안 생성',
      description:
        'Multi-Agent(Analyst → Architect → Validator)가 자동으로 최적의 ERD를 설계합니다',
      detail:
        'LangGraph 기반 Multi-Agent가 도메인을 분석하고, 정규화와 제약조건을 검증하며, 최적화된 스키마를 생성합니다.',
      icon: 'ri-magic-line',
      color: 'from-cyan-500 to-blue-500',
      image:
        'https://readdy.ai/api/search-image?query=AI%20artificial%20intelligence%20processing%20data%20with%20neural%20network%20visualization%2C%20automated%20database%20schema%20generation%2C%20flowing%20data%20streams%2C%20modern%20tech%20aesthetic%20with%20blue%20and%20cyan%20gradients%2C%20clean%20minimalist%20background&width=1200&height=600&seq=howitworks2&orientation=landscape',
    },
    {
      number: '03',
      title: '실시간 편집',
      description: '팀이 WebSocket 기반 협업 편집기로 설계를 함께 정교화합니다',
      detail:
        '실시간 커서 공유, 테이블 잠금, 변경사항 동기화로 팀원들과 충돌 없이 동시에 작업할 수 있습니다.',
      icon: 'ri-group-line',
      color: 'from-purple-500 to-pink-500',
      image:
        'https://readdy.ai/api/search-image?query=Team%20collaboration%20interface%20with%20multiple%20cursors%20editing%20database%20diagram%20simultaneously%2C%20real-time%20synchronization%20visualization%2C%20modern%20collaborative%20workspace%2C%20blue%20and%20purple%20gradient%20theme%2C%20clean%20professional%20design&width=1200&height=600&seq=howitworks3&orientation=landscape',
    },
    {
      number: '04',
      title: '버전 관리 & 문서화',
      description:
        '히스토리 저장, 스냅샷 비교, 자동 문서화가 동시에 진행됩니다',
      detail:
        '모든 변경사항이 자동으로 버전 관리되며, 이전 버전과의 비교 및 복원이 가능합니다. AI가 자동으로 문서를 생성합니다.',
      icon: 'ri-file-list-3-line',
      color: 'from-pink-500 to-red-500',
      image:
        'https://readdy.ai/api/search-image?query=Version%20control%20timeline%20interface%20showing%20document%20history%20and%20snapshots%2C%20automated%20documentation%20generation%2C%20clean%20timeline%20visualization%20with%20purple%20and%20pink%20gradients%2C%20modern%20professional%20UI%20design&width=1200&height=600&seq=howitworks4&orientation=landscape',
    },
    {
      number: '05',
      title: 'Export & Integration',
      description: 'OpenAPI/DDL/DTO를 export하여 바로 개발에 활용하세요',
      detail:
        '완성된 ERD를 다양한 포맷으로 export하여 즉시 개발 환경에 통합할 수 있습니다.',
      icon: 'ri-download-cloud-line',
      color: 'from-red-500 to-pink-500',
      image:
        'https://readdy.ai/api/search-image?query=Code%20export%20and%20integration%20interface%20showing%20multiple%20file%20formats%20being%20generated%2C%20API%20documentation%2C%20DDL%20scripts%2C%20modern%20developer%20tools%2C%20pink%20and%20red%20gradient%20theme%2C%20clean%20minimalist%20design&width=1200&height=600&seq=howitworks5&orientation=landscape',
    },
  ];

  return (
    <section className="py-32 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-40 left-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-block px-6 py-2 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm mb-6">
            HOW IT WORKS
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="text-blue-600">아이디어</span>에서
            <br />
            <span className="text-blue-600">개발-ready ERD</span>까지
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              몇 분이면 끝.
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            YALDI가 작동하는 5단계 프로세스를 확인하세요
          </p>
        </div>

        {/* Vertical Steps */}
        <div className="space-y-32">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step Content */}
              <div
                className={`flex flex-col ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } items-center gap-12 lg:gap-20`}
              >
                {/* Text Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-2xl`}
                    >
                      <span className="text-white font-bold text-2xl">
                        {step.number}
                      </span>
                    </div>
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center shadow-lg`}
                    >
                      <i className={`${step.icon} text-3xl text-white`} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-4xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-xl text-gray-700 mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-3">
                    {index === 0 && (
                      <>
                        <span className="px-4 py-2 bg-cyan-500 text-cyan-100 rounded-full text-sm font-semibold">
                          자연어 처리
                        </span>
                        <span className="px-4 py-2 bg-cyan-500 text-cyan-100 rounded-full text-sm font-semibold">
                          요구사항 분석
                        </span>
                      </>
                    )}
                    {index === 1 && (
                      <>
                        <span className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full text-sm font-semibold">
                          Multi-Agent AI
                        </span>
                        <span className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full text-sm font-semibold">
                          자동 정규화
                        </span>
                        <span className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full text-sm font-semibold">
                          제약조건 검증
                        </span>
                      </>
                    )}
                    {index === 2 && (
                      <>
                        <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                          WebSocket
                        </span>
                        <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                          실시간 동기화
                        </span>
                        <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                          충돌 방지
                        </span>
                      </>
                    )}
                    {index === 3 && (
                      <>
                        <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">
                          버전 관리
                        </span>
                        <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">
                          스냅샷
                        </span>
                        <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">
                          AI 문서화
                        </span>
                      </>
                    )}
                    {index === 4 && (
                      <>
                        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          OpenAPI
                        </span>
                        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          DDL
                        </span>
                        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          DTO
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Image */}
                <div className="flex-1 w-full">
                  <div className="relative group">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500`}
                    />
                    <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100 group-hover:border-blue-200 transition-all duration-500 group-hover:shadow-3xl group-hover:-translate-y-2">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-auto object-cover"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-t ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                      />
                    </div>
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
