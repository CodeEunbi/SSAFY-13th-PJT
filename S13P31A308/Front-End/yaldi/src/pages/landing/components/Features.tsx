export default function Features() {
  const features = [
    {
      icon: 'ri-robot-2-line',
      title: 'AI 기반 ERD 자동 생성',
      description:
        '요구사항 텍스트만 입력하면 LangGraph 기반 Multi-Agent가 도메인 분석부터 스키마 초안 생성까지',
      details: [
        '정규화 · 제약조건 · 관계 검증까지 자동 수행',
        '최적화 제안 기능 포함',
        '10초 이내 초안 완성',
      ],
      color: 'from-blue to-cyan-400',
    },
    {
      icon: 'ri-team-line',
      title: '실시간 협업 편집',
      description:
        'WebSocket 기반 실시간 편집 동기화로 팀원들과 함께 ERD를 완성하세요',
      details: [
        '팀원 위치(커서), 테이블 잠금, 변경 사항 표시',
        'Redis Pub/Sub로 다중 사용자 충돌 없이 동시 작업',
        '즉각적인 변경사항 반영',
      ],
      color: 'from-cyan-500 to-light-blue',
    },
    {
      icon: 'ri-git-branch-line',
      title: '버전 관리 + 스냅샷',
      description:
        '모든 변경을 버전 단위로 저장하고 언제든 이전 버전으로 복원 가능',
      details: [
        '스냅샷 조회 및 이전 버전 복원',
        'pgvector 기반 유사 버전 추천',
        '완벽한 변경 이력 추적',
      ],
      color: 'from-blue to-purple-400',
    },
    {
      icon: 'ri-file-text-line',
      title: 'AI 기반 문서화 & 검증',
      description: 'ERD로부터 자동으로 개발에 필요한 모든 문서를 생성합니다',
      details: [
        'OpenAPI/DTO/Schema 자동 문서화',
        'Import된 ERD의 오류/위험 요소 자동 검사',
        '개발 ready 문서 즉시 생성',
      ],
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: 'ri-search-line',
      title: '검색 & 추천 시스템',
      description: '강력한 검색과 AI 추천으로 필요한 정보를 빠르게 찾으세요',
      details: [
        'Elasticsearch 전문 검색',
        'Vector Search로 유사 프로젝트 추천',
        'Neo4j Graph RAG 기반 초안 생성',
      ],
      color: 'from-pink-500 to-red-500',
    },
    {
      icon: 'ri-code-s-slash-line',
      title: 'Export & Integration',
      description:
        '다양한 형식으로 내보내기하고 개발 워크플로우에 바로 통합하세요',
      details: [
        'DDL/OpenAPI/DTO 자동 생성',
        '다양한 데이터베이스 지원',
        'CI/CD 파이프라인 연동',
      ],
      color: 'from-red-500 to-orange-500',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <span className="text-blue-600">핵심 기능</span>으로
            <br />
            데이터 모델링을 혁신합니다
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI부터 협업, 버전 관리까지 모든 것이 하나의 플랫폼에
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 bg-white rounded-3xl border-2 border-blue-100 hover:border-transparent transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer overflow-hidden"
            >
              {/* Gradient Background on Hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
              />

              {/* Decorative Circle */}
              <div
                className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${feature.color} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700`}
              />

              {/* Icon with Gradient */}
              <div className="relative mb-6">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}
                >
                  <i className={`${feature.icon} text-3xl text-white`} />
                </div>
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {feature.description}
                </p>

                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div
                        className={`w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5`}
                      >
                        <i
                          className={`ri-check-line text-lg bg-gradient-to-br ${feature.color} bg-clip-text text-transparent font-bold`}
                        />
                      </div>
                      <span className="text-gray-700 text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Gradient Line */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
