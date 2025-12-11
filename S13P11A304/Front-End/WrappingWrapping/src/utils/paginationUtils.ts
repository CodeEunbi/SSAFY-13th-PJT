/**
 * 페이지네이션 유틸리티 함수
 */

export interface PaginationConfig {
  currentPage: number; // 현재 페이지
  totalPages: number; // 페이지 총 개수
  delta?: number; // 현재 페이지를 기준으로 앞뒤로 보여줄 페이지 수
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * 페이지네이션 정보 생성 함수
 * @param config - 페이지네이션 설정
 * @returns PaginationInfo - 페이지네이션 정보 객체
 */
export const generatePageNumbers = (
  config: PaginationConfig,
): (number | string)[] => {
  const { currentPage, totalPages, delta = 2 } = config;
  const pages: (number | string)[] = [];

  if (totalPages <= 1) {
    return [1];
  }

  // 첫 페이지는 항상 표시
  pages.push(1);

  // 현재 페이지를 기준으로 양 페이지 계산
  const start = Math.max(2, currentPage - delta);
  const end = Math.min(totalPages - 1, currentPage + delta);

  // 첫 페이지와 현재 페이지 사이에 갭이 존재하면 말 줄임표 추가
  if (start > 2) {
    pages.push('...');
  }

  for (let i = start; i <= end; i++) {
    // 첫 페이지와 마지막 페이지는 스킵
    if (i !== 1 && i !== totalPages) {
      pages.push(i);
    }
  }

  // 현재 페이지와 마지막 페이지 사이에 갭이 존재하면 말 줄임표 추가
  if (end < totalPages - 1) {
    pages.push('...');
  }

  // 마지막 페이지는 항상 표시
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
};

/**
 * 페이지네이션 정보 계산 함수
 * @param currentPage - 현재 페이지
 * @param totalItems - 총 아이템 수
 * @param itemsPerPage - 페이지당 아이템 수
 * @returns PaginationInfo - 페이지네이션 정보 객체
 */
export const calculatePaginationInfo = (
  currentPage: number,
  totalItems: number,
  itemsPerPage: number,
): PaginationInfo => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems - 1);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
};

/**
 * 현재 페이지에 해당하는 데이터를 슬라이싱하는 함수
 * @param data - 전체 데이터 배열
 * @param currentPage - 현재 페이지
 * @param itemsPerPage - 페이지당 아이템 수
 * @returns T[] - 현재 페이지에 해당하는 데이터 배열
 */
export const getSlicedData = <T>(
  data: T[],
  currentPage: number,
  itemsPerPage: number,
): T[] => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
};

/**
 * 페이지 번호 유효성 검사 함수
 * @description 페이지 번호가 유효한 범위 내에 있는지 확인하고, 범위를 벗어나면 조정합니다.
 *
 * @param page - 현재 페이지 번호
 * @param totalPages - 총 페이지 수
 * @example validatePageNumber(0, 5) // 1
 * @example validatePageNumber(6, 5) // 5
 * @example validatePageNumber(3, 5) // 3
 *
 * @returns number - 유효한 페이지 번호
 */
export const validatePageNumber = (
  page: number,
  totalPages: number,
): number => {
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
};

/**
 * 페이지네이션 URL 생성 함수
 * @description 현재 페이지와 추가 파라미터를 포함한 URL을 생성합니다.
 * @param page - 현재 페이지 번호
 * @param additionalParams - 추가로 포함할 URL 파라미터
 * @example generatePaginationUrl(2, { search: 'test' }) // "?page=2&search=test"
 * @returns string - 생성된 URL 문자열
 */
export const generatePaginationUrl = (
  page: number,
  additionalParams?: Record<string, string>,
): string => {
  const params = new URLSearchParams();
  params.set('page', page.toString());

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.set(key, value);
    });
  }

  return `?${params.toString()}`;
};
