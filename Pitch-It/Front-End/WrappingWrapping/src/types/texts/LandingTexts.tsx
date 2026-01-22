import { theme } from '../../styles/theme';
import userImage1 from '../../assets/images/userstory_user1.png';
import userImage2 from '../../assets/images/userstory_user2.png';
import userImage3 from '../../assets/images/userstory_user3.png';
import iconChart from '../../assets/images/icon_chart.png';
import iconFilm from '../../assets/images/icon_film.png';
import iconGraph from '../../assets/images/icon_graph.png';

export const landingTexts = {
  heroName: (
    <span>
      <span className={`text-${theme.primary}`}>Pitch</span>:It
    </span>
  ),

  heroTitle: (
    <span>
      발표가 두렵지 않은 <span className={`text-${theme.primary}`}>AI 면접 연습실</span>
    </span>
  ),

  heroDescription: [
    "실전 PT 면접처럼,",
    "랜덤 주제, 발표 순서, 시간 제한까지 완벽하게 시뮬레이션 가능!",
    "AI 기반 리포트로 나의 성장도 확인해보세요!"
  ],

  userstories: [
    {
      message: "실전 감각을 기르기가 너무 어려워요. 실전 감각을 키우고 싶은데, 혼자 연습하는 건 한계가 있더라구요",
      position: "백엔드 개발자 희망, 취업 준비 3개월차",
      imageUrl: userImage1,
      direction: "left" as const
    },
    {
      message: "스터디원들과 시간을 맞추는 게 점점 어려워지더라고요. 그래서 제가 원하는 시간에, 혼자서도 몰입해서 면접 연습할 수 있는 환경이 필요했어요.",
      position: "QA 엔지니어 희망, 취업 준비 6개월차", 
      imageUrl: userImage2,
      direction: "right" as const
    },
    {
      message: "스터디를 하다 보면 매번 시간을 조율하는 게 은근히 스트레스였어요. 그래서 제가 편한 시간에 면접 연습을 할 수 있었으면 좋겠다고 늘 생각했어요.",
      position: "UX 디자이너 준비 중, 취업 준비 4개월차",
      imageUrl: userImage3,
      direction: "left" as const
    }
  ],

  features: [
    {
      icon: iconChart,
      title: "나에게 맞는 질문으로 시작하기",
      subtitle: "직무와 유형만 고르면, 질문은 우리가 준비할게요",
      features: [
        "개발, 마케팅, 영업 등 원하는 직무 선택",
        "PT, 인성, 기술 등 면접 유형 선택",
        "선택에 맞춘 AI 질문 자동 생성",
        "막막한 시작을 덜어주는, '진짜 같은 질문'"
      ]
    },
    {
      icon: iconFilm,
      title: "실전처럼 발표하고, 질문 받고",
      subtitle: "준비 시간부터 타이머까지, 실제 면접처럼 연습해요",
      features: [
        "제한된 준비 시간 제공",
        "타이머와 순서 지정으로 긴장감 있는 발표",
        "랜덤 발표 순서 & 참가자 간 질의응답",
        "혼자가 아닌 같이 할 수 있는 시뮬레이션"
      ]
    },
    {
      icon: iconGraph,
      title: "AI 피드백으로 성장 확인",
      subtitle: "발표 내용을 분석해, 나의 논리와 표현을 돌아봐요",
      features: [
        "AI 기반 발표 내용 분석 리포트 제공",
        "논리성, 말의 흐름, 구조 등 정교하게 피드백",
        "추가 학습을 위한 맞춤형 질문 제공",
        "데이터 기반의 구제적인 성장 경험 만들기 가능!"
      ]
    }
  ]

};