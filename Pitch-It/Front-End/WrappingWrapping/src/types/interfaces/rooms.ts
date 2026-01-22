import { RemoteTrackPublication, LocalVideoTrack } from 'livekit-client';

export type TrackInfo = {
  trackPublication: RemoteTrackPublication;
  participantIdentity: string;
};

// 로컬과 원격 트랙을 모두 처리할 수 있는 통합 타입
export type VideoTrackInfo = {
  type: 'local' | 'remote';
  track: LocalVideoTrack | any; // RemoteVideoTrack
  participantIdentity: string;
  trackSid: string;
};

export interface RoomInfo {
  jobCategory: string;
  modeType: string;
  participantIds: number[];
  question: string | null;
  requirements: string | null;
  scheduledTime: string;
  situation: string | null;
  title: string;
}
