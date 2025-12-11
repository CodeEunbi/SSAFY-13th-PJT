// 마이페이지 관련 타입 정의

// 사용자 정보 인터페이스
export interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  profileImage?: string;
}

// 예약 정보 인터페이스
export interface ReservationInfo {
  id: number;
  scheduledTime: string;
  jobCategory: string;
  title: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

// 리포트 상세 정보 인터페이스
export interface ReportDetailData {
  summary: string;
  key_points: string[];
  star_method: string[];
  additional_questions: string[];
  pros_and_cons: {
    장점: string;
    단점: string;
  };
  scores: {
    total: number;
    논리력: number;
    완성도: number;
    표현력: number;
    창의성: number;
    적합성: number;
  };
}
