// src/types/interfaces/mainPage.ts

export interface UserData {
  id: number;
  email: string;
  name: string;
  nickname: string;
}

export interface UserDataSimple {
  email: string;
  nickname: string;
}

export interface RoomData {
  active: boolean;
  creatorId: number;
  id: number;
  title: string;
  scheduledTime: string;
  jobCategory: string;
  modeType: string;
  maxParticipant: number;
  participants: number;
  _participant: boolean;
}

export interface RoomListProps {
  date: string;
  time: string;
  job: string;
  title: string;
  participants: string;
  inActive: boolean;
  isParticipanted: boolean;
  onclick?: () => void;
}

export const jobs = [
  { label: '경영·사무', value: 'MANAGEMENT' },
  { label: '마케팅·광고·홍보', value: 'MARKETING' },
  { label: '무역·유통', value: 'TRADE' },
  { label: 'IT·인터넷', value: 'DEVELOPER' },
  { label: '생산·제조', value: 'MANUFACTURING' },
  { label: '건설', value: 'CONSTRUCTION' },
  { label: '영업·고객상담', value: 'SALES' },
  { label: '금융', value: 'FINANCE' },
  { label: '미디어', value: 'MEDIA' },
  { label: '디자인', value: 'DESIGN' },
];

export interface RoomMeetingProps {
  jobCategory: string;
  modeType: string;
  participantIds: number[];
  question: string | null;
  requirements: string | null;
  scheduledTime: string;
  situation: string | null;
  title: string;
}
