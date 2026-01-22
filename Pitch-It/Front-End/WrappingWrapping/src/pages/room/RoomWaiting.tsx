// src/pages/room/RoomWaiting.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMediaStore } from '../../stores/useMediaStore';
import { useRoomContext } from '../../contexts/RoomContext';
import FilledButton from '../../components/common/FilledButton';
import Timer from '../../components/common/Timer';
import { useRoom } from '../../hooks/useRooms';
import ButtonWithIcon from '../../components/common/ButtonWithIcon';
import ExitIcon from '../../assets/icons/exit.svg';

import CamOnIcon from '../../assets/icons/camOn.svg';
import CamOffIcon from '../../assets/icons/camOff.svg';
import MicOnIcon from '../../assets/icons/micOn.svg';
import MicOffIcon from '../../assets/icons/micOff.svg';

type MD = { deviceId: string; label: string };

export default function RoomWaiting() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { leaveRoom } = useRoomContext();

  const {
    isCameraOn,
    isMicOn,
    setCameraOn,
    setMicOn,
    videoDeviceId,
    audioDeviceId,
    setVideoDevice,
    setAudioDevice,
  } = useMediaStore();

  const [cams, setCams] = useState<MD[]>([]);
  const [mics, setMics] = useState<MD[]>([]);
  const [permError, setPermError] = useState<string | null>(null);

  // 프리뷰용
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  // 마이크 레벨계
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micSrcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // 방 정보 가져오기
  const { room } = useRoom(roomId || '');

  // cleanup 함수
  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (micSrcRef.current) micSrcRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    if (audioCtxRef.current) audioCtxRef.current.close();
    previewStreamRef.current?.getTracks().forEach((t) => t.stop());
  };

  // 초기 설정
  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) return;

        previewStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        setCams(
          devices
            .filter((d) => d.kind === 'videoinput')
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || 'Camera',
            })),
        );
        setMics(
          devices
            .filter((d) => d.kind === 'audioinput')
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || 'Microphone',
            })),
        );

        // 오디오 분석기 설정
        setupAudioAnalyzer(stream);
      } catch (e) {
        console.error(e);
        setPermError('카메라/마이크 권한이 필요합니다.');
      }
    };

    setup();
    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  // 오디오 분석기 설정 함수
  const setupAudioAnalyzer = (stream: MediaStream) => {
    try {
      audioCtxRef.current = new AudioContext();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      micSrcRef.current = audioCtxRef.current.createMediaStreamSource(stream);
      micSrcRef.current.connect(analyserRef.current);

      const draw = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const c = canvasRef.current;
        const g = c.getContext('2d')!;
        const data = new Uint8Array(analyserRef.current.fftSize);
        analyserRef.current.getByteTimeDomainData(data);
        g.clearRect(0, 0, c.width, c.height);
        g.fillStyle = '#222';
        g.fillRect(0, 0, c.width, c.height);

        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const level = Math.min(1, rms * 3);
        const barH = level * c.height;
        g.fillStyle = '#FC6C86';
        g.fillRect(0, c.height - barH, c.width, barH);
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch (error) {
      console.warn('오디오 분석기 설정 실패:', error);
    }
  };

  // 카메라 켜기/끄기
  const handleCameraToggle = async () => {
    if (!previewStreamRef.current) return;

    const videoTrack = previewStreamRef.current.getVideoTracks()[0];

    if (isCameraOn) {
      if (videoTrack) {
        videoTrack.stop();
        previewStreamRef.current.removeTrack(videoTrack);
      }
      setCameraOn(false);
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        });

        const newVideoTrack = videoStream.getVideoTracks()[0];
        if (newVideoTrack) {
          previewStreamRef.current.addTrack(newVideoTrack);

          if (videoRef.current) {
            videoRef.current.srcObject = previewStreamRef.current;
            await videoRef.current.play().catch(() => {});
          }
        }
        setCameraOn(true);
      } catch (error) {
        console.error('카메라 켜기 실패:', error);
      }
    }
  };

  // 마이크 켜기/끄기
  const handleMicToggle = async () => {
    if (!previewStreamRef.current) return;

    const audioTrack = previewStreamRef.current.getAudioTracks()[0];

    if (isMicOn) {
      if (audioTrack) {
        audioTrack.stop();
        previewStreamRef.current.removeTrack(audioTrack);
        if (micSrcRef.current) {
          micSrcRef.current.disconnect();
          micSrcRef.current = null;
        }
      }
      setMicOn(false);
    } else {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        });

        const newAudioTrack = audioStream.getAudioTracks()[0];
        if (newAudioTrack) {
          previewStreamRef.current.addTrack(newAudioTrack);

          if (audioCtxRef.current && analyserRef.current) {
            micSrcRef.current = audioCtxRef.current.createMediaStreamSource(
              previewStreamRef.current,
            );
            micSrcRef.current.connect(analyserRef.current);
          }
        }
        setMicOn(true);
      } catch (error) {
        console.error('마이크 켜기 실패:', error);
      }
    }
  };

  // 디바이스 변경 처리
  const handleVideoDeviceChange = async (deviceId: string) => {
    setVideoDevice(deviceId || undefined);

    if (!isCameraOn || !previewStreamRef.current) return;

    try {
      const oldVideoTrack = previewStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
        previewStreamRef.current.removeTrack(oldVideoTrack);
      }

      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      });

      const newVideoTrack = videoStream.getVideoTracks()[0];
      if (newVideoTrack) {
        previewStreamRef.current.addTrack(newVideoTrack);

        if (videoRef.current) {
          videoRef.current.srcObject = previewStreamRef.current;
          await videoRef.current.play().catch(() => {});
        }
      }
    } catch (error) {
      console.error('비디오 디바이스 변경 실패:', error);
    }
  };

  const handleAudioDeviceChange = async (deviceId: string) => {
    setAudioDevice(deviceId || undefined);

    if (!isMicOn || !previewStreamRef.current) return;

    try {
      const oldAudioTrack = previewStreamRef.current.getAudioTracks()[0];
      if (oldAudioTrack) {
        oldAudioTrack.stop();
        previewStreamRef.current.removeTrack(oldAudioTrack);
        if (micSrcRef.current) {
          micSrcRef.current.disconnect();
          micSrcRef.current = null;
        }
      }

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });

      const newAudioTrack = audioStream.getAudioTracks()[0];
      if (newAudioTrack) {
        previewStreamRef.current.addTrack(newAudioTrack);

        if (audioCtxRef.current && analyserRef.current) {
          micSrcRef.current = audioCtxRef.current.createMediaStreamSource(
            previewStreamRef.current,
          );
          micSrcRef.current.connect(analyserRef.current);
        }
      }
    } catch (error) {
      console.error('오디오 디바이스 변경 실패:', error);
    }
  };

  const enterMeeting = () => navigate(`/meeting/${roomId}`);

  // Context의 leaveRoom 사용 (미디어 정리는 자동으로 처리됨)
  const exitMeeting = () => {
    cleanup(); // 로컬 스트림 정리
    previewStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Context의 leaveRoom 호출 (스토어 초기화 및 네비게이션 포함)
    leaveRoom();
  };

  return (
    <div className="w-full min-h-screen bg-my-black flex flex-col">
      {/* 상단 헤더 영역 */}
      <div className="flex items-center justify-between p-6">
        {/* 왼쪽 타이머 */}
        <div className="bg-watermelon rounded-3xl min-w-24 px-4 py-2 text-my-black text-center font-bold text-xl">
          <Timer
            endTime={room?.scheduledTime || null}
            onExpire={enterMeeting}
          />
        </div>

        {/* 중앙 제목 */}
        <h1 className="text-my-white text-2xl font-medium">
          카메라 / 오디오 상태 점검
        </h1>

        {/* 오른쪽 퇴장 버튼 */}
        <ButtonWithIcon onClick={exitMeeting} size="w-7 h-7">
          <img src={ExitIcon} alt="Exit" />
        </ButtonWithIcon>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col xl:flex-row gap-6 p-6">
        {/* 비디오 프리뷰 영역 */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-4xl">
            {permError ? (
              <div className="w-full aspect-video flex text-watermelon text-xl items-center justify-center text-center bg-my-black rounded-3xl border-2 border-watermelon">
                {permError}
              </div>
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full aspect-video object-cover rounded-3xl border-2 border-watermelon"
              />
            )}
          </div>
        </div>

        {/* 컨트롤 패널 */}
        <div className="h-full min-w-0 flex flex-col items-stretch justify-between gap-6">
          <div className="flex flex-col justify-between gap-3">
            <label className="block">
              <div className="mb-1 text-xl">카메라</div>
              <select
                value={videoDeviceId || ''}
                onChange={(e) => handleVideoDeviceChange(e.target.value)}
                className="w-full bg-my-black rounded-full p-2 pr-8 
                  ring-1 ring-watermelon focus:ring-2 focus:ring-watermelon outline-none"
              >
                <option value="">기본</option>
                {cams.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-xl">마이크</div>
              <select
                value={audioDeviceId || ''}
                onChange={(e) => handleAudioDeviceChange(e.target.value)}
                className="w-full bg-my-black rounded-full p-2 pr-8 
                  ring-1 ring-watermelon focus:ring-2 focus:ring-watermelon outline-none"
              >
                <option value="">기본</option>
                {mics.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <label className="block mb-2 font-medium text-xl">
                마이크 입력 레벨
              </label>
              <canvas
                ref={canvasRef}
                width={220}
                height={30}
                className="w-full bg-gray-700 rounded-3xl border border-watermelon"
              />
            </div>
          </div>

          {/* 하단 컨트롤 버튼들 */}
          <div className="flex justify-center space-x-4">
            <ButtonWithIcon onClick={handleCameraToggle}>
              {isCameraOn ? (
                <img
                  src={CamOnIcon}
                  alt="Camera On"
                  className="w-12 h-12 p-1"
                />
              ) : (
                <img
                  src={CamOffIcon}
                  alt="Camera Off"
                  className="w-12 h-12 p-1"
                />
              )}
            </ButtonWithIcon>
            <ButtonWithIcon onClick={handleMicToggle}>
              {isMicOn ? (
                <img src={MicOnIcon} alt="Mic On" className="w-12 h-12 p-1" />
              ) : (
                <img src={MicOffIcon} alt="Mic Off" className="w-12 h-12 p-1" />
              )}
            </ButtonWithIcon>

            {/* TODO: 삭제 */}
            <FilledButton
              label="회의 입장"
              onClick={enterMeeting}
              size="text-lg px-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
