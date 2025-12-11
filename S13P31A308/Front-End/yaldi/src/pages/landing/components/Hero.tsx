import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import yaldiLogo from '../../../assets/images/yaldi-logo.svg';
import yaldiMascot from '../../../assets/images/yaldi-mascot.png';

interface HeroProps {
  scrollY: number;
}

export default function Hero({ scrollY }: HeroProps) {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleStartClick = () => {
    navigate('/login');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl -top-64 -left-64"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="absolute w-[500px] h-[500px] bg-gradient-to-r from-sky-200/30 to-blue-200/30 rounded-full blur-3xl top-1/2 -right-48"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
        <div
          className="absolute w-[400px] h-[400px] bg-gradient-to-r from-cyan-100/40 to-sky-100/40 rounded-full blur-3xl -bottom-32 left-1/4"
          style={{ transform: `translateY(${scrollY * 0.05}px)` }}
        />
      </div>

      {/* Floating Dots */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-8 md:px-16 lg:px-24 py-8 lg:py-12">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Logo */}
              <div className="mb-4">
                <img
                  src={yaldiLogo}
                  alt="YALDI"
                  className="h-20 md:h-24 mx-auto lg:mx-0"
                />
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                설계의 시작부터
                <br />
                협업의 끝까지,
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  AI가 함께합니다
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-xl mx-auto lg:mx-0">
                아이디어, 구조화, 협업, 문서화까지
                <br />— 설계의 모든 과정을 자동화합니다
              </p>

              {/* CTA Button */}
              <div className="flex justify-center lg:justify-start mb-6">
                <button
                  onClick={handleStartClick}
                  type="button"
                  className="group px-10 py-4 bg-blue rounded-full font-bold text-xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center cursor-pointer"
                >
                  <span className="text-my-white">시작하러 가기</span>
                  <i className="ri-arrow-right-line ml-2 text-xl text-white group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <i className="ri-time-line text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">30초</div>
                    <div className="text-xs text-gray-500">ERD 생성</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <i className="ri-team-line text-cyan-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      실시간
                    </div>
                    <div className="text-xs text-gray-500">팀 협업</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                    <i className="ri-git-branch-line text-sky-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      무제한
                    </div>
                    <div className="text-xs text-gray-500">버전 관리</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Mascot */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl scale-110" />
                {/* Mascot Image */}
                <img
                  src={yaldiMascot}
                  alt="YALDI Mascot"
                  className="relative w-56 md:w-72 lg:w-80 drop-shadow-2xl animate-swing"
                />
                <style>{`
                  @keyframes swing {
                    0%, 100% { transform: rotate(-8deg); }
                    50% { transform: rotate(8deg); }
                  }
                  .animate-swing {
                    animation: swing 3s ease-in-out infinite;
                    transform-origin: center center;
                  }
                `}</style>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
