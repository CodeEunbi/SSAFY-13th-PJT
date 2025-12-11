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
import { useNavigate } from 'react-router-dom';
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
  const isDisconnecting = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const audioSinkRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const roomInstanceRef = useRef<Room | null>(null);

  // 수동 종료 여부(재접속 판단용)
  const manualLeaveRef = useRef(false);

  const navigate = useNavigate();

  const { addParticipant, removeParticipant, setMyParticipantId } =
    useRoomStore();

  const handleConnected = useCallback(
    (room: Room) => {
      if (!mountedRef.current) return;

      console.log('✅ LiveKit 서버 연결 성공');
      const identity = room.localParticipant.identity;

      setRoomState((prev) => ({
        ...prev,
        isConnected: true,
        myKey: identity,
      }));

      setMyParticipantId(identity);
      addParticipant({
        id: identity,
        joinedAt: new Date(),
        role: 'presenter',
      });

      room.remoteParticipants.forEach((p) => {
        addParticipant({
          id: p.identity,
          joinedAt: new Date(),
          role: 'presenter',
        });

        const videoPublication = Array.from(p.trackPublications.values()).find(
          (pub) => pub.kind === 'video' && pub.isSubscribed,
        );

        if (videoPublication) {
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

  const handleDisconnected = useCallback(
    (reason?: any) => {
      console.log('❌ 연결 해제:', reason);
      if (mountedRef.current) {
        setRoomState((prev) => ({ ...prev, isConnected: false }));
      }

      // 사용자가 나가기 누른 게 아니면 재접속 시도(최대 3회 지수 백오프)
      if (!manualLeaveRef.current) {
        let tries = 0;
        const retry = async () => {
          tries++;
          const backoff = Math.min(1000 * 2 ** (tries - 1), 8000);
          try {
            if (!roomInstanceRef.current || !mountedRef.current) return;
            const token = await getToken(roomId);
            await roomInstanceRef.current.connect(
              LIVEKIT_URL.replace(/\/+$/, ''),
              token,
              { autoSubscribe: true, maxRetries: 5 },
            );
            console.log('✅ 재접속 성공');
          } catch (e) {
            console.warn(`재접속 실패(${tries})`, e);
            if (tries < 3 && mountedRef.current && !manualLeaveRef.current) {
              setTimeout(retry, backoff);
            }
          }
        };
        retry();
      }
    },
    [roomId],
  );

  const handleParticipantConnected = useCallback(
    (participant: RemoteParticipant) => {
      if (!mountedRef.current) return;

      console.log('👤 참가자 입장:', participant.identity);

      addParticipant({
        id: participant.identity,
        joinedAt: new Date(),
        role: 'presenter',
      });

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
      if (!mountedRef.current) return;

      console.log('👤 참가자 퇴장:', participant.identity);

      removeParticipant(participant.identity);

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
      if (!mountedRef.current) return;

      if (publication.kind === 'audio') {
        try {
          const sid = publication.trackSid;
          const exists = audioSinkRef.current?.querySelector<HTMLAudioElement>(
            `audio[data-track-sid="${sid}"]`,
          );
          if (!exists && audioSinkRef.current) {
            const el = document.createElement('audio');
            el.autoplay = true;
            el.controls = false;
            el.dataset.trackSid = sid;
            track.attach(el as HTMLMediaElement);
            audioSinkRef.current.appendChild(el);
          }
          console.log('🔊 오디오 attached:', publication.trackSid);
        } catch (error) {
          console.error('오디오 연결 실패:', error);
        }
      }

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
      if (!mountedRef.current) return;

      if (publication.kind === 'audio') {
        const sid = publication.trackSid;
        const el = audioSinkRef.current?.querySelector<HTMLAudioElement>(
          `audio[data-track-sid="${sid}"]`,
        );
        if (el) {
          try {
            track.detach(el as HTMLMediaElement);
          } catch {
            /* noop */
          }
          el.remove();
        }
      }

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
    if (!mountedRef.current) return;

    console.log('📹 로컬 트랙 발행됨:', publication.kind);
    if (publication.kind === 'video' && publication.videoTrack) {
      setRoomState((prev) => ({ ...prev, localTrack: publication.videoTrack }));
    }
  }, []);

  const handleLocalTrackUnpublished = useCallback((publication: any) => {
    if (!mountedRef.current) return;

    console.log('📹 로컬 트랙 발행 해제됨:', publication.kind);
    if (publication.kind === 'video') {
      setRoomState((prev) => ({ ...prev, localTrack: null }));
    }
  }, []);

  const updateMediaSettings = useCallback(
    async (cameraEnabled: boolean, micEnabled: boolean) => {
      if (
        !roomState.liveKitRoom ||
        !roomState.isConnected ||
        !mountedRef.current
      )
        return;

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
    if (isConnecting.current || isDisconnecting.current || !roomId) {
      console.log('⏸️ 연결/정리 중이거나 roomId 없음, 스킵');
      return;
    }

    mountedRef.current = true;
    isConnecting.current = true;
    let r: Room | null = null;

    const initializeRoom = async () => {
      try {
        if (!mountedRef.current) return;

        r = new Room({
          videoCaptureDefaults: videoDeviceId
            ? { deviceId: videoDeviceId }
            : undefined,
          audioCaptureDefaults: audioDeviceId
            ? { deviceId: audioDeviceId }
            : undefined,

          // 🔑 페이지 이탈 자동 disconnect 방지
          disconnectOnPageLeave: false,
        });

        roomInstanceRef.current = r;

        // 상태 로깅
        r.on(RoomEvent.ConnectionStateChanged, (s) => {
          console.log('[LK] connection state =', s);
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

        const url = LIVEKIT_URL.replace(/\/+$/, '');

        await r.connect(url, token, {
          autoSubscribe: true,
          maxRetries: 5,
        });

        // Connected 보장 + 짧은 대기
        await new Promise<void>((resolve, reject) => {
          let timer: any;
          const onConnected = () => {
            clearTimeout(timer);
            r!.off(RoomEvent.Connected, onConnected);
            resolve();
          };
          r!.on(RoomEvent.Connected, onConnected);
          if ((r as any).state === 'connected') {
            r!.off(RoomEvent.Connected, onConnected);
            resolve();
          }
          timer = setTimeout(() => {
            r!.off(RoomEvent.Connected, onConnected);
            reject(new Error('Connected event timeout'));
          }, 5000);
        });

        await new Promise((res) => setTimeout(res, 50));

        // 안전 발행: engine not connected에 한해 재시도
        const safeEnable = async () => {
          const attempt = async () => {
            await r!.localParticipant.enableCameraAndMicrophone();
            await r!.localParticipant.setCameraEnabled(isCameraOn);
            await r!.localParticipant.setMicrophoneEnabled(isMicOn);
          };

          const maxRetries = 3;
          let delay = 150;
          for (let i = 0; i < maxRetries; i++) {
            try {
              await attempt();
              console.log('✅ enableCameraAndMicrophone 성공');
              return;
            } catch (e: any) {
              const msg = String(e?.message || e);
              console.warn(`⚠️ publish 실패(${i + 1}/${maxRetries}):`, msg);
              if (!/engine not connected/i.test(msg)) {
                throw e;
              }
              await new Promise((res) => setTimeout(res, delay));
              delay *= 2;
            }
          }
          throw new Error('publish 재시도 초과');
        };

        await safeEnable();

        if (mountedRef.current) {
          setRoomState((prev) => ({ ...prev, liveKitRoom: r! }));
          console.log('✅ Room 초기화 완료');
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error('Room 초기화 실패:', error);
        }
        if (r) {
          try {
            await r.disconnect();
          } catch (disconnectError) {
            console.warn('연결 해제 중 오류:', disconnectError);
          }
        }
      } finally {
        isConnecting.current = false;
      }
    };

    initializeRoom();

    // 개선된 cleanup (여기서만 실제 disconnect/정리)
    cleanupRef.current = async () => {
      if (isDisconnecting.current) {
        console.log('⏸️ 이미 정리 중, 스킵');
        return;
      }

      isDisconnecting.current = true;
      mountedRef.current = false;
      manualLeaveRef.current = true; // 수동 종료 표시
      console.log('🧹 cleanup 시작...');

      const roomToCleanup = roomInstanceRef.current || r;

      if (roomToCleanup) {
        try {
          const state = (roomToCleanup as any).state;
          console.log('🔍 Room 상태:', state);

          if (state === 'connecting') {
            await new Promise((res) => setTimeout(res, 500));
          }

          if (state === 'connected' && roomToCleanup.localParticipant) {
            try {
              const lp = roomToCleanup.localParticipant;
              for (const [, pub] of lp.audioTrackPublications) {
                if (pub.track) pub.track.stop();
              }
              for (const [, pub] of lp.videoTrackPublications) {
                if (pub.track) pub.track.stop();
              }
              console.log('🎯 로컬 트랙 정지 완료');
            } catch (trackError) {
              console.warn('cleanup - 트랙 정리 실패:', trackError);
            }
          }

          roomToCleanup.removeAllListeners();
          await roomToCleanup.disconnect();
          console.log('🔌 Room 연결 해제 완료');
        } catch (cleanupError) {
          console.warn('cleanup - Room 정리 실패:', cleanupError);
        }
      }

      try {
        audioSinkRef.current
          ?.querySelectorAll('audio')
          .forEach((a) => a.remove());
      } catch (audioError) {
        console.warn('cleanup - 오디오 엘리먼트 정리 실패:', audioError);
      }

      setRoomState({
        liveKitRoom: null,
        localTrack: null,
        remoteTracks: [],
        myKey: '',
        isConnected: false,
      });

      roomInstanceRef.current = null;
      isConnecting.current = false;
      isDisconnecting.current = false;

      console.log('✅ Room 정리 완료');
      navigate('/mypage');
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
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
    navigate,
  ]);

  const manualCleanup = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
    }
  }, []);

  return {
    ...roomState,
    audioSinkRef,
    updateMediaSettings,
    cleanup: manualCleanup,
  };
};
