// src/pages/mypage/ReportList.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReportCard from './ReportCard';
import Pagination from '../../components/layout/Pagination';
import ReportModal from '../report/ReportModal';
import { validatePageNumber } from '../../utils/paginationUtils';
import { getReports, type Report } from '../../api/report';
import apiController from '../../api/apiController';
import WithdrawModal from '../../components/common/WithdrawModal';

const PER_PAGE = 5;

interface ReportListProps {
  nickname: string;
}

export default function ReportList({ nickname }: ReportListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [totalItems, setTotalItems] = useState(0); // = totalElements
  const [totalPages, setTotalPages] = useState(1); // = totalPages
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // 삭제 확인 모달
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('확인');
  const [targetId, setTargetId] = useState<number | null>(null);
  const [confirmText, setConfirmText] = useState('삭제');

  const [searchParams, setSearchParams] = useSearchParams();

  // URL의 page 값을 먼저 사용
  const pageParam = Number(searchParams.get('page') ?? '1') || 1;
  const currentPage = validatePageNumber(pageParam, totalPages || 1);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const {
          items,
          totalPages: tp,
          totalItems: ti,
        } = await getReports(currentPage, PER_PAGE);
        if (ignore) return;

        setReports(items || []);
        setTotalItems(ti ?? 0);
        setTotalPages(tp ?? 1);

        // 현재 페이지가 범위를 벗어나면 마지막 페이지로 보정
        if ((tp ?? 1) > 0 && currentPage > (tp ?? 1)) {
          setSearchParams({ page: String(tp ?? 1) });
        }
      } catch (e) {
        console.error('리포트 불러오기 실패:', e);
        if (!ignore) {
          setReports([]);
          setTotalItems(0);
          setTotalPages(1);
          if (currentPage !== 1) setSearchParams({ page: '1' });
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [currentPage, setSearchParams]);

  const handleCardClick = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const askDeleteReport = (id: number) => {
    setTargetId(id);
    setConfirmTitle('리포트를 삭제할까요?');
    setConfirmText('삭제');
    setIsConfirmOpen(true);
  };

  const confirmDeleteReport = async () => {
    if (targetId == null) return;
    try {
      setConfirmText('삭제 중...');
      await apiController({
        method: 'DELETE' as const,
        url: `reports/${targetId}`,
      });

      const {
        items,
        totalPages: tp,
        totalItems: ti,
      } = await getReports(currentPage, PER_PAGE);

      if (items.length === 0 && currentPage > 1) {
        setSearchParams({ page: String(Math.max(1, currentPage - 1)) });
      } else {
        setReports(items || []);
        setTotalItems(ti ?? 0);
        setTotalPages(tp ?? 1);
        setSearchParams({
          page: String(validatePageNumber(currentPage, tp ?? 1)),
        });
      }
    } catch (e) {
      console.error('리포트 삭제 실패:', e);
    } finally {
      setConfirmText('삭제');
      setIsConfirmOpen(false);
      setTargetId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4">내 리포트</h2>

      <div className="flex flex-col h-full">
        <div className="h-[380px] flex flex-col space-y-4 overflow-y-auto">
          {reports.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              리포트가 없습니다.
            </div>
          ) : (
            reports.map((report) => (
              <ReportCard
                key={report.id}
                date={report.date}
                job={report.job}
                topic={report.topic}
                onClick={() => handleCardClick(report)}
                onDeleteClick={() => askDeleteReport(report.id)}
              />
            ))
          )}
        </div>

        <div className="h-5 flex items-center justify-center">
          {totalPages > 1 && (
            <Pagination
              totalItems={totalItems}
              itemsPerPage={PER_PAGE}
              currentPage={currentPage}
            />
          )}
        </div>
      </div>

      {isModalOpen && selectedReport && (
        <ReportModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          nickname={nickname}
          selectedReport={selectedReport}
        />
      )}

      {/* 삭제 확인 모달 */}
      <WithdrawModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDeleteReport}
        title={confirmTitle}
        confirmText={confirmText}
        cancelText="취소"
      />
    </div>
  );
}
