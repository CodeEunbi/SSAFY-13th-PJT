import { Mic, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface STTStatusIndicatorProps {
  isRecording: boolean;
  sttStatus:
    | 'idle'
    | 'recording'
    | 'uploading'
    | 'processing'
    | 'completed'
    | 'error';
}

const STTStatusIndicator = ({ sttStatus }: STTStatusIndicatorProps) => {
  const getStatusInfo = () => {
    switch (sttStatus) {
      case 'recording':
        return {
          icon: <Mic className="w-4 h-4" />,
          text: '발표 음성 자동 녹음 중...',
          color: 'text-red-500',
          bgColor: 'bg-red-500',
          animate: true,
        };
      case 'uploading':
        return {
          icon: <Upload className="w-4 h-4" />,
          text: 'STT 서버 업로드 중...',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500',
          animate: true,
        };
      case 'processing':
        return {
          icon: <Loader className="w-4 h-4 animate-spin" />,
          text: 'STT 처리 중...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500',
          animate: false,
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'STT 처리 완료',
          color: 'text-green-500',
          bgColor: 'bg-green-500',
          animate: false,
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'STT 처리 실패',
          color: 'text-red-500',
          bgColor: 'bg-red-500',
          animate: false,
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  if (!statusInfo && sttStatus === 'idle') {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-white font-semibold mb-2">자동 STT 처리</h3>
        <div className="text-gray-400 text-sm text-center py-4">
          내 발표 차례에 자동으로 음성이 녹음되고 STT 처리됩니다.
        </div>
      </div>
    );
  }

  if (!statusInfo) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="text-white font-semibold mb-2">자동 STT 처리</h3>
      <div className={`flex items-center ${statusInfo.color}`}>
        {statusInfo.animate && (
          <div
            className={`w-3 h-3 ${statusInfo.bgColor} rounded-full animate-pulse mr-2`}
          ></div>
        )}
        {statusInfo.icon}
        <span className="text-sm ml-2">{statusInfo.text}</span>
      </div>
    </div>
  );
};

export default STTStatusIndicator;
