import React, { useState, useEffect, useMemo } from 'react';
import ShareIcon from '../../../assets/icons/share_icon.svg?react';
import CopyIcon from '../../../assets/icons/copy_icon.svg?react';
import BuildSuccessIcon from '../../../assets/icons/build_success_icon.svg?react';
import ModalSmall from '../../../components/common/ModalSmall';
import InputBox from '../../../components/common/InputBox';
import { apiController } from '../../../apis/apiController';
import { useParams } from 'react-router-dom';

interface ShareProps {
  onModalChange?: (open: boolean) => void;
}


interface ViewerLinkResponse {
        "linkId": string;
        "viewerUrl": string;
        "remainingTtlSeconds": number;
        "expiresAt": string;
    }

const Share: React.FC<ShareProps> = ({
  onModalChange,
}) => {


  const {projectKey} = useParams();

  const [ViewerLinkResponse, setViewerLinkResponse] = React.useState<ViewerLinkResponse>({
        "linkId": "",
        "viewerUrl": "",
        "remainingTtlSeconds": 0,
        "expiresAt": ""
    });

  const createViewerLink = async () => {

    try {
      const response = await apiController({
        url: `/api/v1/viewer/projects/${projectKey}/link`,
        method: 'post',
      });

      console.log("뷰어 링크 생성 성공", response);
      setViewerLinkResponse(response.data.result);

    } catch (err) {
      console.log("뷰어 링크 생성 오류 발생.", err);
      onModalChange?.(false);
    }

  }

  // 만료일 문자열도 한 번만 계산
  const expirationDateString = useMemo(() => {
    if (!ViewerLinkResponse.expiresAt) return '';
    return new Date(ViewerLinkResponse.expiresAt).toLocaleString('ko-KR');
  }, [ViewerLinkResponse]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  const handleOpen = () => {
    setIsModalOpen(true);
    onModalChange?.(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    onModalChange?.(false);
  };

  useEffect(() => {
    if (!showCopyToast) return;

    const timer = window.setTimeout(() => {
      setShowCopyToast(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [showCopyToast]);

  // 유효기간 카운트다운 계산
  useEffect(() => {
    if (!ViewerLinkResponse.expiresAt) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const expirationDate = new Date(ViewerLinkResponse.expiresAt);
      const now = new Date();
      const diff = expirationDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
      });
    };

    // 즉시 계산
    calculateTimeRemaining();

    // 1초마다 업데이트
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [ViewerLinkResponse]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(ViewerLinkResponse.viewerUrl);
      setShowCopyToast(true);
    } catch (error) {
      console.error('링크 복사 실패:', error);
    }
  };


  React.useEffect(() => {
    createViewerLink();
  }, []);

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center mb-2 hover:bg-ai-chat rounded transition-colors"
        aria-label="공유"
      >
        <ShareIcon className="w-5 h-5 text-my-black" />
      </button>

      <ModalSmall
        isOpen={isModalOpen}
        onClose={handleClose}
        title="프로젝트 공유 링크"
      >
        <div className="flex flex-col gap-4 w-full">
          <p className="text-my-black text-base font-pretendard">
            아래 링크를 통해 뷰어를 초대하세요.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-my-black text-sm font-semibold font-pretendard">
              링크
            </label>
            <div className="flex gap-2">
              <InputBox
                type="text"
                value={ViewerLinkResponse.viewerUrl}
                readOnly
                className="flex-1"
                size="px-[20px] py-[10px]"
              />
              <button
                onClick={handleCopyLink}
                className="px-2 py-2 border-2 border-my-border rounded-[10px] hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all duration-150 flex items-center justify-center"
                aria-label="링크 복사"
              >
                <CopyIcon className="w-5 h-5 text-my-black" />
              </button>
            </div>
          </div>

          {ViewerLinkResponse.expiresAt && (
            <div className="flex flex-col gap-2">
              <label className="text-my-black text-sm font-semibold font-pretendard">
                유효기간
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-[10px] border border-my-border">
                {timeRemaining ? (
                  timeRemaining.isExpired ? (
                    <p className="text-red-500 text-sm font-pretendard font-medium">
                      링크가 만료되었습니다.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <p className="text-my-black text-sm font-pretendard">
                        {timeRemaining.days > 0 && (
                          <span className="font-semibold">{timeRemaining.days}일 </span>
                        )}
                        {timeRemaining.hours > 0 && (
                          <span className="font-semibold">{timeRemaining.hours}시간 </span>
                        )}
                        {timeRemaining.minutes > 0 && (
                          <span className="font-semibold">{timeRemaining.minutes}분 </span>
                        )}
                        <span className="font-semibold">{timeRemaining.seconds}초</span>
                        <span className="text-my-gray-500"> 남았습니다</span>
                      </p>
                      <p className="text-xs text-my-gray-500 font-pretendard">
                        만료일: {expirationDateString}
                      </p>
                    </div>
                  )
                ) : (
                  <p className="text-my-gray-500 text-sm font-pretendard">
                    계산 중...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </ModalSmall>

      {showCopyToast && (
        <div className="fixed bottom-6 left-1/2 z-50">
          <div className="transform -translate-x-1/2">
            <div className="bg-my-black text-my-white px-6 py-3 rounded-[10px] shadow-lg flex items-center gap-2 animate-fadeIn">
              <BuildSuccessIcon className="w-5 h-5" />
              <span className="font-pretendard text-sm font-medium">
                링크가 복사되었습니다.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Share;
