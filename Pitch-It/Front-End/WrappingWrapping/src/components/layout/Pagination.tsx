import { FC } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../../styles/theme';
import {
  generatePageNumbers,
  calculatePaginationInfo,
  generatePaginationUrl,
} from '../../utils/paginationUtils';
import LinedButton from '../common/LinedButton';
import FilledButton from '../common/FilledButton';

interface PaginationProps {
  totalItems: number; // 아이템 총 개수
  itemsPerPage: number; // 페이지당 아이템 개수
  currentPage: number; // 현재 페이지
  delta?: number; // 현재 페이지 전후로 표시할 페이지 수(페이지네이션 버튼)
}

const Pagination: FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  delta = 2,
}) => {
  const paginationInfo = calculatePaginationInfo(
    currentPage,
    totalItems,
    itemsPerPage,
  );

  const { totalPages } = paginationInfo;

  const pageNumbers = generatePageNumbers({
    currentPage,
    totalPages,
    delta,
  });

  return (
    <nav className="flex justify-center mt-4">
      <ul className="flex items-center space-x-1">
        {/* 페이지 번호 버튼 */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <li key={`ellipsis-${index}`}>
                <span className={`px-3 py-2 text-sm text-${theme.primary}`}>
                  {page}
                </span>
              </li>
            );
          }

          const pageNum = page as number;
          const isActive = currentPage === pageNum;

          return (
            <li key={`page-${pageNum}`}>
              <Link to={generatePaginationUrl(pageNum)}>
                {isActive ? (
                  <FilledButton
                    label={pageNum.toString()}
                    size="min-w-8 h-8 text-sm"
                  ></FilledButton>
                ) : (
                  <LinedButton
                    label={pageNum.toString()}
                    size="min-w-8 h-8 text-sm"
                  ></LinedButton>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Pagination;
