// src/api/report.ts
import apiController from '../api/apiController';

export interface Report {
  id: number;
  date: string; // "YY-MM-DD"
  job: string; // enum name()
  topic: string; // = title
  mode: string; // enum name()
  question?: string;
}

export interface PagedReports {
  items: Report[];
  totalPages: number; // backend totalPages
  totalItems: number; // backend totalElements
}

/** ISO → "YY-MM-DD" */
function formatDate(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** 리포트 목록 조회 (Spring 0-based page) */
export async function getReports(
  page: number,
  size: number,
): Promise<PagedReports> {
  const res = await apiController({
    method: 'GET' as const,
    url: '/reports',
    params: { page: Math.max(0, page - 1), size },
  });

  // 컨트롤러에서 result로 감싸는 경우/안 감싸는 경우 모두 대응
  const payload = res?.data?.result ?? res?.data ?? {};

  // { reports: [...] } 또는 { content: [...] }
  const rawItems: any[] = Array.isArray(payload.reports)
    ? payload.reports
    : Array.isArray(payload.content)
      ? payload.content
      : [];

  const items: Report[] = rawItems.map((it) => ({
    id: Number(it?.id),
    date: formatDate(it?.meetingAt ?? it?.createdAt ?? ''),
    job: String(it?.job ?? ''),
    topic: String(it?.title ?? ''),
    mode: String(it?.mode ?? ''),
    question: it?.question != null ? String(it.question) : undefined,
  }));

  // 백엔드 값을 그대로 사용
  const totalPages = Number(payload.totalPages ?? 1) || 1;
  const totalItems =
    Number(payload.totalElements) || // ← 정확한 총 개수
    0; // (없다면 0; 백엔드에서 넣어주면 자동으로 반영됨)

  return { items, totalPages, totalItems };
}

/* 리포트 삭제 */
export async function deleteReport(reportId: number): Promise<void> {
  await apiController({
    method: 'DELETE' as const,
    url: `/reports/${reportId}`,
  });
}
