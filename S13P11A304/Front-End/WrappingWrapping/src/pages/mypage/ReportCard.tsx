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
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* 작은 화면: w-full로 최대한 표시 / md+: 기존 max-w 유지 */}
        <div
          className="
            w-full md:w-auto
            text-center
            truncate
            overflow-hidden
            whitespace-nowrap
            px-1
            md:mx-auto
            md:max-w-[360px]
            lg:max-w-[520px]
          "
          title={mainLine}
        >
          {mainLine}
        </div>
      </div>

      <button
        className="text-white hover:text-watermelon ml-2 shrink-0"
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
