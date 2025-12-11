import React from 'react';
import FilledButton from '../../../components/common/FilledButton';
import LinedButton from '../../../components/common/LinedButton';

interface AiDraftConfirmBannerProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tableCount?: number;
  explanation?: string;
}

const AiDraftConfirmBanner: React.FC<AiDraftConfirmBannerProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  tableCount = 0,
  explanation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border-2 border-blue p-6 animate-fadeIn">
        <div className="flex flex-col gap-4">
          {/* 메시지 영역 */}
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-my-black">
              ✨ AI가 ERD 초안 생성을 완료했습니다
            </h3>
            <p className="text-base text-my-black">
              총 <strong className="font-semibold text-blue">{tableCount}개</strong>의 테이블이 생성되었습니다.
            </p>

            {explanation && (
              <div className="mt-2 rounded-lg border border-my-border bg-gray-50 p-3">
                <p className="text-sm font-medium text-my-black mb-1">AI 분석 결과</p>
                <p className="text-sm text-my-black/80 line-clamp-3">{explanation}</p>
                {/* <p className="text-sm text-my-black/80 line-clamp-3">보내주신 요구사항에 맞춰 ERD를 설계하였습니다. 도출된 ERD는 사용자님의 요구사항을 모두 반영하여 설계되었습니다.</p> */}
              </div>
            )}

            <p className="text-sm text-my-black/70 mt-1">
              워크스페이스에 미리보기로 표시된 테이블들을 적용하시겠습니까?
            </p>
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-3">
            <LinedButton
              label="삭제"
              onClick={onCancel}
              size="px-6 py-2.5 text-sm"
            />
            <FilledButton
              label="적용"
              onClick={onConfirm}
              size="px-6 py-2.5 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiDraftConfirmBanner;
