// src/pages/mypage/ReportDetail.tsx
import { useState, useEffect } from 'react';
import apiController from '../../api/apiController';
import type { ReportDetailData } from '../../types/interfaces/mypage';
import ToggleSection from '../../components/common/Toggle';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

interface ReportDetailProps {
  selectedReport?: { id: number };
}

interface ReportDetailResponse {
  situation?: string | string[];
  requirements?: string | string[];
  question?: string | string[];
  content?: string | ReportDetailData;
}

function tryJSONParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function safeParseContent(raw: unknown): ReportDetailData | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw as ReportDetailData;

  if (typeof raw === 'string') {
    let parsed = tryJSONParse(raw);
    if (!parsed && raw.startsWith('"') && raw.endsWith('"')) {
      const outer = tryJSONParse(raw);
      if (typeof outer === 'string') parsed = tryJSONParse(outer);
    }
    if (!parsed) {
      const unescaped = raw.replace(/\\n/g, '\n').replace(/\\"/g, '"');
      parsed = tryJSONParse(unescaped);
    }
    return (parsed ?? null) as ReportDetailData | null;
  }

  return null;
}

export default function ReportDetail({ selectedReport }: ReportDetailProps) {
  const [script, setScript] = useState('');
  const [condition, setCondition] = useState('');
  const [ptQuestion, setPtQuestion] = useState('');
  const [content, setContent] = useState<ReportDetailData | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchDetail = async () => {
      if (!selectedReport?.id) return;
      try {
        setError(null);
        setLoading(true);
        const response = await apiController({
          method: 'GET' as const,
          url: `/reports/${selectedReport.id}`,
        });
        const result: ReportDetailResponse = response?.data?.result ?? {};

        // 배열로 올 수도 있으니 문자열로 안전 변환
        const toLines = (v: unknown) =>
          Array.isArray(v) ? v.join('\n') : String(v ?? '');

        setScript(toLines(result.requirements));
        setCondition(toLines(result.situation));
        setPtQuestion(toLines(result.question));
        setContent(safeParseContent(result.content));
      } catch (e) {
        if (!cancelled) setError('리포트 정보를 불러오는 데 실패했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedReport?.id]);

  const summary = content?.summary ?? '';
  const pros = content?.pros_and_cons?.장점 ?? '';
  const cons = content?.pros_and_cons?.단점 ?? '';
  const starText = (content?.star_method ?? []).join('\n');
  const keyPoints = content?.key_points ?? [];

  const expected = [...(content?.additional_questions ?? [])];
  while (expected.length < 3) expected.push('');

  const radarLabels = ['논리력', '완성도', '표현력', '창의성', '적합성'];
  const radarMax = 20;
  const radarValues = radarLabels.map((k) => {
    const v = Number((content as any)?.scores?.[k] ?? 0);
    return Number.isFinite(v) ? Math.min(Math.max(v, 0), radarMax) : 0;
  });

  const radarData = {
    labels: radarLabels,
    datasets: [
      {
        label: '점수',
        data: radarValues,
        borderWidth: 2,
        borderColor: 'rgba(255, 99, 132, 0.9)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 0.9)',
        pointRadius: 3,
        fill: true,
      },
    ],
  };

  const radarOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.label}: ${ctx.parsed.r} / ${radarMax}`,
        },
      },
    },
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: radarMax,
        ticks: {
          display: false,
          stepSize: 5,
          color: '#e5e7eb',
          backdropColor: 'rgba(0,0,0,0)',
        },
        grid: { color: 'rgba(255,255,255,0.15)' },
        angleLines: { color: 'rgba(255,255,255,0.15)' },
        pointLabels: {
          color: '#f5f5f5',
          font: { size: 12, weight: '600' },
        },
      },
    },
  };

  if (loading) return <div className="p-4 text-center text-watermelon">로딩 중...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2">
      {/* 토글 적용 */}
      <ToggleDetailBlock title="PT 질문">
        {ptQuestion || ' '}
      </ToggleDetailBlock>

      <ToggleDetailBlock title="문제 배경">
        {script || ' '}
      </ToggleDetailBlock>

      <ToggleDetailBlock title="조건">
        {condition.trim() ? (
          <ul className="list-disc list-inside space-y-2">
            {condition
              .split('\n')
              .map((line) => line.replace(/^\s*-\s*/, '').trim())
              .filter(Boolean)
              .map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
          </ul>
        ) : (
          ' '
        )}
      </ToggleDetailBlock>

      {/* 차트 + 요약 */}
      <section className="bg-black/30 p-4 rounded-xl">
        <div className="h-64">
          <Radar data={radarData} options={radarOptions} />
        </div>
        <p className="text-center mt-2">{summary}</p>
      </section>

      {/* 주요 포인트 - 리스트 표시 */}
      {keyPoints.length > 0 && (
        <DetailBlock
          title="주요 포인트"
          content={
            keyPoints.length ? (
              <ul className="list-disc list-inside space-y-2">
                {keyPoints
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
              </ul>
            ) : (
              ' '
            )
          }
        />
      )}

      {/* 장점 / 단점 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DetailBlock title="장점" content={pros} />
        <DetailBlock title="단점" content={cons} />
      </div>

      {/* STAR 기법 */}
      <DetailBlock title="STAR 기법" content={starText} />

      {/* 추가 예상 질문 */}
      <section className="bg-black/30 p-6 rounded-xl">
        <h3 className="font-semibold text-base mb-4">추가 예상 질문</h3>
        <ul className="text-sm space-y-3">
          {expected.slice(0, 3).map((q, idx) => (
            <li key={idx} className="flex items-start">
              <span className="text-watermelon font-bold mr-3 min-w-[20px]">
                {idx + 1}.
              </span>
              <span className="text-my-white leading-relaxed">{q || ' '}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* 공용 DetailBlock: content를 React.ReactNode로 변경 (문자열/노드 모두 허용) */
function DetailBlock({ title, content }: { title: string; content: React.ReactNode }) {
  return (
    <section className="bg-black/30 p-4 rounded-xl">
      <h3 className="font-semibold text-base text-my-white mb-3">{title}</h3>
      <div className="text-sm text-my-white leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </section>
  );
}

/* 토글 + DetailBlock 스타일 */
function ToggleDetailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <ToggleSection title={title}>
      <div className="text-sm text-my-white leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </ToggleSection>
  );
}
