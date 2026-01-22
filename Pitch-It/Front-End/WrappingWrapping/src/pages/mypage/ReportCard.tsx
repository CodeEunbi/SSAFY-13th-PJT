import { TrashIcon } from '@heroicons/react/24/outline';
import { theme } from '../../styles/theme';
import { findLabelByValue } from '../../utils/roomUtils';

interface ReportCardProps {
  date: string;
  job: string;
  topic: string;
  onClick: () => void;
  onDeleteClick: () => void;
}

export default function ReportCard({
  date,
  job,
  topic,
  onClick,
  onDeleteClick,
}: ReportCardProps) {
  const mainLine = `${date} | 직무: ${findLabelByValue(job)} | 회의 제목: ${topic}`;

  return (
    <div
      className={`border border-watermelon rounded-2xl p-4 flex items-center cursor-pointer hover:bg-${theme.primaryLight} hover:bg-opacity-20 transition-colors duration-200`}
      onClick={onClick}
    >
      {/* 내용을 세로로 묶는 래퍼 */}
      <div className="flex-1 flex flex-col justify-center">
        {/* 메인 한 줄: 반응형 max-width + 줄임표 */}
        <div
          className="
            text-center
            truncate
            overflow-hidden
            whitespace-nowrap
            mx-auto
            max-w-[180px]
            sm:max-w-[260px]
            md:max-w-[360px]
            lg:max-w-[520px]
          "
          title={mainLine}
        >
          {mainLine}
        </div>
      </div>

      <button
        className="text-white hover:text-watermelon ml-2"
        aria-label="삭제"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteClick();
        }}
      >
        <TrashIcon className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
