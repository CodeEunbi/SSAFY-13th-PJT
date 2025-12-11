import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import ReportDetail from './ReportDetail';
import { Report } from '../../api/report';
import { findLabelByValue } from '../../utils/roomUtils';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  nickname: string;
  selectedReport?: Report;
}

export default function ReportModal({
  isOpen,
  onClose,
  nickname,
  selectedReport,
}: ReportModalProps) {
  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={onClose}
      />

      <OverlayScrollbarsComponent
        element="div"
        options={{
          scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' },
        }}
        defer
        style={{
          width: '90%',
          maxWidth: '1000px',
          height: '85vh',
          overflow: 'hidden',
        }}
        className="relative bg-[#1e1e1e] p-6 rounded-2xl border border-watermelon text-white shadow-lg"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">
              <span className="text-watermelon">{nickname}</span>
              <span className="text-my-white">님의 리포트</span>
            </h2>
            {selectedReport && (
              <p className="text-sm text-gray-300">
                {`${selectedReport.date} | 직무: ${findLabelByValue(selectedReport.job)} | 회의 제목 : ${selectedReport.topic}`}
              </p>
            )}
          </div>
          <button
            className="hover:text-watermelon transition-colors duration-200 p-1 ml-4"
            onClick={onClose}
          >
            <XMarkIcon className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="pb-8">
          <ReportDetail selectedReport={selectedReport} />
        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
}
