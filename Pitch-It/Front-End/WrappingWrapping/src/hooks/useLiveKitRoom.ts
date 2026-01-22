// src/hooks/useLiveKitRoom.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  LocalVideoTrack,
  RemoteTrack,
  RemoteParticipant,
  RemoteTrackPublication,
} from 'livekit-client';
import { getToken } from '../utils/roomUtils';
import { useRoomStore } from '../stores/useRoomStore';
import type { TrackInfo } from '../types/interfaces/rooms';

const LIVEKIT_URL = 'wss://pitch-it.co.kr/livekit/';

interface RoomState {
  liveKitRoom: Room | null;
  localTrack: LocalVideoTrack | null;
  remoteTracks: TrackInfo[];
  myKey: string;
  isConnected: boolean;
}

interface UseLiveKitRoomProps {
  roomId: string;
  videoDeviceId?: string;
  audioDeviceId?: string;
  isCameraOn: boolean;
  isMicOn: boolean;
}

export const useLiveKitRoom = ({
  roomId,
  videoDeviceId,
  audioDeviceId,
  isCameraOn,
  isMicOn,
}: UseLiveKitRoomProps) => {
  const [roomState, setRoomState] = useState<RoomState>({
    liveKitRoom: null,
    localTrack: null,
    remoteTracks: [],
    myKey: '',
    isConnected: false,
  });

  const isConnecting = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const audioSinkRef = useRef<HTMLDivElement>(null);

  // store에서 참가자 관리 함수들 가져오기
  const { addParticipant, removeParticipant, setMyParticipantId } =
    useRoomStore();

  const handleConnected = useCallback(
    (room: Room) => {
      console.log('✅ LiveKit 서버 연결 성공');
      const identity = room.localParticipant.identity;

      setRoomState((prev) => ({
        ...prev,
        isConnected: true,
        myKey: identity,
      }));

      // 자신을 참가자로 등록
      setMyParticipantId(identity);
      addParticipant({
        id: identity,
        joinedAt: new Date(),
        role: 'presenter',
      });

      console.log('내 참가자 ID:', identity);

      // 이미 연결된 원격 참가자들도 등록
      room.remoteParticipants.forEach((p) => {
        console.log(`참가자 ${p.identity}`);
        addParticipant({
          id: p.identity,
          joinedAt: new Date(),
          role: 'presenter',
        });

        // 🔑 각 참가자를 remoteTracks에 추가 (비디오 트랙 유무와 관계없이)
        const videoPublication = Array.from(p.trackPublications.values()).find(
          (pub) => pub.kind === 'video' && pub.isSubscribed,
        );

        if (videoPublication) {
          // 실제 비디오 트랙이 있는 경우
          setRoomState((prev) => ({
            ...prev,
            remoteTracks: [
              ...prev.remoteTracks,
              {
                trackPublication: videoPublication,
                participantIdentity: p.identity,
              },
            ],
          }));
        } else {
          // 비디오 트랙이 없는 경우 더미 트랙 추가
          setRoomState((prev) => ({
            ...prev,
            remoteTracks: [
              ...prev.remoteTracks,
              {
                trackPublication: {
                  trackSid: `dummy-${p.identity}`,
                  kind: 'video',
                  isSubscribed: false,
                  videoTrack: null,
                } as any,
                participantIdentity: p.identity,
              },
            ],
          }));
        }
      });
    },
    [addParticipant, setMyParticipantId],
  );

  const handleDisconnected = useCallback((reason?: any) => {
    console.log('❌ 연결 해제:', reason);
    setRoomState((prev) => ({ ...prev, isConnected: false }));
  }, []);

  const handleParticipantConnected = useCallback(
    (participant: RemoteParticipant) => {
      console.log('👤 참가자 입장:', participant.identity);

      // 새로운 참가자를 store에 추가
      addParticipant({
        id: participant.identity,
        joinedAt: new Date(),
        role: 'presenter',
      });

      // 🔑 참가자 입장 시 즉시 remoteTracks에 더미 트랙 추가
      setRoomState((prev) => ({
        ...prev,
        remoteTracks: [
          ...prev.remoteTracks.filter(
            (t) => t.participantIdentity !== participant.identity,
          ),
          {
            trackPublication: {
              trackSid: `dummy-${participant.identity}`,
              kind: 'video',
              isSubscribed: false,
              videoTrack: null,
            } as any,
            participantIdentity: participant.identity,
          },
        ],
      }));
    },
    [addParticipant],
  );

  const handleParticipantDisconnected = useCallback(
    (participant: RemoteParticipant) => {
      console.log('👤 참가자 퇴장:', participant.identity);

      // 참가자를 store에서 제거
      removeParticipant(participant.identity);

      // 🔑 remoteTracks에서도 해당 참가자의 모든 트랙 제거
      setRoomState((prev) => ({
        ...prev,
        remoteTracks: prev.remoteTracks.filter(
          (t) => t.participantIdentity !== participant.identity,
        ),
      }));
    },
    [removeParticipant],
  );

  const handleTrackSubscribed = useCallback(
    (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      if (publication.kind === 'audio') {
        try {
          const sid = publication.trackSid;
          const exists = audioSinkRef.current?.querySelector<HTMLAudioElement>(
            `audio[data-track-sid="${sid}"]`,
          );
          if (!exists) {
            const el = document.createElement('audio');
            el.autoplay = true;
            el.controls = false;
            el.dataset.trackSid = sid;
            track.attach(el as HTMLMediaElement);
            audioSinkRef.current?.appendChild(el);
          }
          console.log('🔊 오디오 attached:', publication.trackSid);
        } catch (error) {
          console.error('오디오 연결 실패:', error);
        }
      }

      // 🔑 비디오 트랙인 경우 더미 트랙을 실제 트랙으로 교체
      if (publication.kind === 'video') {
        setRoomState((prev) => ({
          ...prev,
          remoteTracks: [
            ...prev.remoteTracks.filter(
              (t) =>
                !(
                  t.participantIdentity === participant.identity &&
                  t.trackPublication.trackSid.startsWith('dummy-')
                ),
            ),
            {
              trackPublication: publication,
              participantIdentity: participant.identity,
            },
          ],
        }));
      } else {
        // 오디오 트랙은 기존 로직 유지
        setRoomState((prev) => ({
          ...prev,
          remoteTracks: [
            ...prev.remoteTracks,
            {
              trackPublication: publication,
              participantIdentity: participant.identity,
            },
          ],
        }));
      }
    },
    [],
  );

  const handleTrackUnsubscribed = useCallback(
    (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      if (publication.kind === 'audio') {
        const sid = publication.trackSid;
        const el = audioSinkRef.current?.querySelector<HTMLAudioElement>(
          `audio[data-track-sid="${sid}"]`,
        );
        if (el) {
          try {
            track.detach(el as HTMLMediaElement);
          } catch (e) {
            // console.error('오디오 detach 실패:', e);
          }
          el.remove();
          // console.log('🔇 오디오 detached & removed:', sid);
        }
      }

      // 🔑 비디오 트랙이 해제될 때 더미 트랙으로 교체
      if (publication.kind === 'video') {
        setRoomState((prev) => ({
          ...prev,
          remoteTracks: [
            ...prev.remoteTracks.filter(
              (t) => t.trackPublication.trackSid !== publication.trackSid,
            ),
            {
              trackPublication: {
                trackSid: `dummy-${participant.identity}`,
                kind: 'video',
                isSubscribed: false,
                videoTrack: null,
              } as any,
              participantIdentity: participant.identity,
            },
          ],
        }));
      } else {
        // 오디오 트랙은 그냥 제거
        setRoomState((prev) => ({
          ...prev,
          remoteTracks: prev.remoteTracks.filter(
            (t) => t.trackPublication.trackSid !== publication.trackSid,
          ),
        }));
      }
    },
    [],
  );

  const handleLocalTrackPublished = useCallback((publication: any) => {
    console.log('📹 로컬 트랙 발행됨:', publication.kind);
    if (publication.kind === 'video' && publication.videoTrack) {
      setRoomState((prev) => ({ ...prev, localTrack: publication.videoTrack }));
    }
  }, []);

  const handleLocalTrackUnpublished = useCallback((publication: any) => {
    console.log('📹 로컬 트랙 발행 해제됨:', publication.kind);
    if (publication.kind === 'video') {
      setRoomState((prev) => ({ ...prev, localTrack: null }));
    }
  }, []);

  const updateMediaSettings = useCallback(
    async (cameraEnabled: boolean, micEnabled: boolean) => {
      if (!roomState.liveKitRoom || !roomState.isConnected) return;

      try {
        await roomState.liveKitRoom.localParticipant.setCameraEnabled(
          cameraEnabled,
        );
        await roomState.liveKitRoom.localParticipant.setMicrophoneEnabled(
          micEnabled,
        );
        console.log('⚙️ 미디어 설정 업데이트:', { cameraEnabled, micEnabled });
      } catch (error) {
        console.error('❌ 미디어 설정 업데이트 실패:', error);
      }
    },
    [roomState.liveKitRoom, roomState.isConnected],
  );

  // 초기 연결
  useEffect(() => {
    if (isConnecting.current || !roomId) return;

    isConnecting.current = true;
    let r: Room | null = null;

    const initializeRoom = async () => {
      try {
        r = new Room({
          videoCaptureDefaults: videoDeviceId
            ? { deviceId: videoDeviceId }
            : undefined,
          audioCaptureDefaults: audioDeviceId
            ? { deviceId: audioDeviceId }
            : undefined,
        });

        r.on(RoomEvent.Connected, () => handleConnected(r!));
        r.on(RoomEvent.Disconnected, handleDisconnected);
        r.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
        r.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        r.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        r.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        r.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
        r.on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);

        const token = await getToken(roomId);
        console.log('🗝️ 토큰 획득:', token);

        await r.connect(LIVEKIT_URL, token, {
          autoSubscribe: true,
          maxRetries: 5,
        });

        await r.localParticipant.enableCameraAndMicrophone();
        await r.localParticipant.setCameraEnabled(isCameraOn);
        await r.localParticipant.setMicrophoneEnabled(isMicOn);

        setRoomState((prev) => ({ ...prev, liveKitRoom: r }));
        console.log('✅ Room 초기화 완료');
      } catch (error) {
        console.error('Room 초기화 실패:', error);
        if (r) await r.disconnect();
      } finally {
        isConnecting.current = false;
      }
    };

    initializeRoom();

    cleanupRef.current = async () => {
      if (r) {
        // 🔑 로컬 트랙들 명시적 정리
        try {
          const localParticipant = r.localParticipant;
          if (localParticipant) {
            // 모든 트랙 정지
            const audioTracks = localParticipant.audioTrackPublications;
            const videoTracks = localParticipant.videoTrackPublications;

            for (const [, publication] of audioTracks) {
              if (publication.track) {
                publication.track.stop();
                console.log('🔇 cleanup - 오디오 트랙 정지');
              }
            }

            for (const [, publication] of videoTracks) {
              if (publication.track) {
                publication.track.stop();
                console.log('📹 cleanup - 비디오 트랙 정지');
              }
            }
          }
        } catch (e) {
          console.error('cleanup - 트랙 정리 실패:', e);
        }

        r.removeAllListeners();
        await r.disconnect();
      }

      audioSinkRef.current
        ?.querySelectorAll('audio')
        .forEach((a) => a.remove());

      setRoomState({
        liveKitRoom: null,
        localTrack: null,
        remoteTracks: [],
        myKey: '',
        isConnected: false,
      });

      console.log('✅ Room 정리 완료');
    };

    return () => {
      cleanupRef.current?.();
    };
  }, [
    roomId,
    videoDeviceId,
    audioDeviceId,
    isCameraOn,
    isMicOn,
    handleConnected,
    handleDisconnected,
    handleParticipantConnected,
    handleParticipantDisconnected,
    handleTrackSubscribed,
    handleTrackUnsubscribed,
    handleLocalTrackPublished,
    handleLocalTrackUnpublished,
  ]);

  // 🔑 cleanup 함수를 외부에서 호출할 수 있도록 노출
  const manualCleanup = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
    }
  }, []);

  return {
    ...roomState,
    audioSinkRef,
    updateMediaSettings,
    cleanup: manualCleanup, // cleanup 함수 노출
  };
};
