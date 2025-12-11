export default function PainPoints() {
  const painPoints = [
    {
      icon: 'ri-time-line',
      title: '요구사항을 ERD로 옮기기까지 긴 시간',
      description:
        '수작업으로 테이블을 하나씩 그리고 관계를 설정하는 반복 작업',
      gradient: 'from-blue to-cyan-400',
    },
    {
      icon: 'ri-user-line',
      title: '사람마다 다른 설계 기준',
      description:
        '테이블 설계 기준이 달라 품질 편차가 발생하고 일관성 유지 어려움',
      gradient: 'from-cyan-500 to-light-blue',
    },
    {
      icon: 'ri-file-damage-line',
      title: '변경 시마다 어긋나는 문서',
      description:
        'ERD 변경 시 문서·코드·협업 채널이 매번 어긋나 동기화 문제 발생',
      gradient: 'from-blue to-purple-500',
    },
    {
      icon: 'ri-team-line',
      title: '실시간 협업 부재',
      description: '충돌, 덮어쓰기, 히스토리 혼란으로 인한 협업 효율 저하',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: 'ri-repeat-line',
      title: '반복되는 스키마 설계 비용',
      description: '프로젝트마다 비슷한 패턴을 처음부터 다시 설계하는 비효율',
      gradient: 'from-pink-500 to-red-500',
    },
    {
      icon: 'ri-error-warning-line',
      title: '검증되지 않은 설계 품질',
      description: '정규화 누락, 인덱스 최적화 부재 등 설계 품질 검증의 어려움',
      gradient: 'from-red-500 to-orange-500',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            데이터 모델링,
            <br />
            <span className="text-blue-600">아직도 수작업으로 하시나요?</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            많은 팀들이 겪고 있는 데이터 모델링의 고민들
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="group relative p-8 bg-white rounded-3xl border-2 border-blue-100 hover:border-transparent transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer overflow-hidden"
            >
              {/* Gradient Background on Hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${point.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
              />

              {/* Icon with Gradient */}
              <div className="relative mb-6">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${point.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}
                >
                  <i className={`${point.icon} text-3xl text-white`} />
                </div>
                {/* Decorative Circle */}
                <div
                  className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br ${point.gradient} rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500`}
                />
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {point.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {point.description}
                </p>
              </div>

              {/* Bottom Accent Line */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${point.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
