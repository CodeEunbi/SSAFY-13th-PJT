import React, { useEffect, useState, useCallback, useRef } from 'react';
import ToggleButton from '../../components/commons/ToggleButton';
import SnackBar from '../../components/commons/SnackBar';
import { useToggleChanges } from '../../hooks/useToggleChanges';
import { theme } from '../../styles/theme';
import {
  getSettings,
  initSettings,
  updateSettings,
  type Settings,
  type TextFilterSettings,
  type TextFilterCategory,
  ALL_TEXT_CATEGORIES,
} from '../../utils/settings';
import { commitSettingsUpdate } from '../../utils/commitSettings';

const TXT_DEFAULTS: TextFilterSettings = {
  enabled: true,
  originalViewEnabled: true,
  categories: [...ALL_TEXT_CATEGORIES],
};

const CATEGORY_LABELS: Record<TextFilterCategory, string> = {
  POLITICS: '정치',
  INSULT: '욕설·비난',
  SEXUAL: '성적 컨텐츠',
  AD: '광고·봇',
  VIOLENCE: '폭력',
};

const TextFiltering: React.FC = () => {
  const [loading, setLoading] = useState(true);

  // UI state
  const [enabled, setEnabled] = useState<boolean>(TXT_DEFAULTS.enabled);
  const [originalViewEnabled, setOriginalViewEnabled] = useState<boolean>(
    TXT_DEFAULTS.originalViewEnabled,
  );
  const [categories, setCategories] = useState<TextFilterCategory[]>(
    TXT_DEFAULTS.categories,
  );

  // 원본(ACK 성공 시에만 갱신)
  const [origEnabled, setOrigEnabled] = useState<boolean>(TXT_DEFAULTS.enabled);
  const [origOriginalViewEnabled, setOrigOriginalViewEnabled] =
    useState<boolean>(TXT_DEFAULTS.originalViewEnabled);
  const [origCategories, setOrigCategories] = useState<TextFilterCategory[]>(
    TXT_DEFAULTS.categories,
  );

  // 서버에 보낸 "완전한 Settings" 보관
  const pendingSaveRef = useRef<Settings | null>(null);

  const { showSnackbar, addPendingChange, confirmChanges, getSnackbarMessage } =
    useToggleChanges();

  // 초기 로드
  useEffect(() => {
    (async () => {
      await initSettings();
      const s = await getSettings();
      const loaded: TextFilterSettings = {
        ...TXT_DEFAULTS,
        ...(s.filterText ?? {}),
        categories:
          s.filterText?.enabled === false
            ? []
            : s.filterText?.categories ?? TXT_DEFAULTS.categories,
      };
      setEnabled(loaded.enabled);
      setOriginalViewEnabled(loaded.originalViewEnabled);
      setCategories(loaded.categories);

      setOrigEnabled(loaded.enabled);
      setOrigOriginalViewEnabled(loaded.originalViewEnabled);
      setOrigCategories(loaded.categories);

      setLoading(false);
    })();
  }, []);

  // 추가: 오프스크린 → 성공/실패 처리
  useEffect(() => {
    const onMsg = async (msg: any) => {
      if (msg?.topic === 'OFFSCREEN:SETTINGS_ACK') {
        if (pendingSaveRef.current) {
          try {
            await updateSettings(pendingSaveRef.current); // 영구 저장
            const fin = pendingSaveRef.current;
            const txt = fin.filterText ?? TXT_DEFAULTS;

            setEnabled(!!txt.enabled);
            setOriginalViewEnabled(!!txt.originalViewEnabled);
            setCategories(txt.categories ?? []);

            setOrigEnabled(!!txt.enabled);
            setOrigOriginalViewEnabled(!!txt.originalViewEnabled);
            setOrigCategories(txt.categories ?? []);
          } finally {
            pendingSaveRef.current = null;
          }
        }
        confirmChanges();
      }

      if (msg?.topic === 'OFFSCREEN:SETTINGS_ERROR') {
        const cur = await getSettings();
        const txt = {
          ...TXT_DEFAULTS,
          ...(cur.filterText ?? {}),
          categories:
            cur.filterText?.enabled === false
              ? []
              : cur.filterText?.categories ?? TXT_DEFAULTS.categories,
        };

        setEnabled(txt.enabled);
        setOriginalViewEnabled(txt.originalViewEnabled);
        setCategories(txt.categories);

        setOrigEnabled(txt.enabled);
        setOrigOriginalViewEnabled(txt.originalViewEnabled);
        setOrigCategories(txt.categories);

        pendingSaveRef.current = null;
        confirmChanges();
      }
    };

    chrome.runtime.onMessage.addListener(onMsg);
    return () => chrome.runtime.onMessage.removeListener(onMsg);
  }, [confirmChanges]);

  // chrome.storage 외부 변경 반영 (원코드 유지)
  useEffect(() => {
    const onChanged = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if ((area === 'local' || area === 'sync') && changes.settingsDoc) {
        const s = changes.settingsDoc.newValue?.settings;
        if (s?.filterText) {
          const txt: TextFilterSettings = {
            ...TXT_DEFAULTS,
            ...s.filterText,
            categories:
              s.filterText.enabled === false
                ? []
                : s.filterText.categories ?? [],
          };
          setEnabled(txt.enabled);
          setOriginalViewEnabled(txt.originalViewEnabled);
          setCategories(txt.categories);
        }
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);

  // --- 로컬 상태만 변경 (확인에서 한 번에 소켓 커밋) ---
  const onToggleEnabled = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    addPendingChange('text.enabled', next, origEnabled, () =>
      Promise.resolve(),
    );

    if (!next) {
      setCategories([]);
    } else if (categories.length === 0) {
      setCategories([...ALL_TEXT_CATEGORIES]);
    }
  }, [enabled, origEnabled, categories, addPendingChange]);

  const onToggleOriginalView = useCallback(() => {
    const next = !originalViewEnabled;
    setOriginalViewEnabled(next);
    addPendingChange(
      'text.originalViewEnabled',
      next,
      origOriginalViewEnabled,
      () => Promise.resolve(),
    );
  }, [originalViewEnabled, origOriginalViewEnabled, addPendingChange]);

  const onToggleCategory = useCallback(
    (cat: TextFilterCategory) => {
      let nextCats: TextFilterCategory[];
      if (categories.includes(cat)) {
        nextCats = categories.filter((c) => c !== cat);
      } else {
        nextCats = [...categories, cat];
      }
      setCategories(nextCats);

      const wasOn = origCategories.includes(cat);
      addPendingChange(
        `text.category.${cat}`,
        nextCats.includes(cat),
        wasOn,
        () => Promise.resolve(),
      );
    },
    [categories, origCategories, addPendingChange],
  );

  // --- 확인: 한 번에 소켓 커밋 ---
  const onConfirm = useCallback(async () => {
    // 1) 현재 저장된 전체 설정을 읽고 → 텍스트 설정만 덮어씀 (다른 설정 보존)
    const current = await getSettings();
    const full: Settings = {
      ...current,
      filterText: {
        enabled,
        originalViewEnabled,
        categories: enabled ? categories : [],
      },
    };

    console.log('[OPTIONS][TXT] commit start', full);

    // 2) 보낸 값 보관 → ACK에서 저장/확정
    pendingSaveRef.current = full;

    // 3) 소켓 커밋
    const res = await commitSettingsUpdate(full);

    // 4) 전송 단계에서 즉시 실패한 경우만 즉시 복구
    if (!res?.ok) {
      const cur = await getSettings();
      const txt = {
        ...TXT_DEFAULTS,
        ...(cur.filterText ?? {}),
        categories:
          cur.filterText?.enabled === false
            ? []
            : cur.filterText?.categories ?? TXT_DEFAULTS.categories,
      };
      setEnabled(txt.enabled);
      setOriginalViewEnabled(txt.originalViewEnabled);
      setCategories(txt.categories);
      pendingSaveRef.current = null;
      confirmChanges();
    }
  }, [enabled, originalViewEnabled, categories, confirmChanges]);

  if (loading) return <div>불러오는 중…</div>;

  return (
    <div>
      {/* 텍스트 필터링 전체 */}
      <div className={`p-4 rounded-3xl bg-${theme.myBoxGrey} mb-4`}>
        <div className="flex items-center justify-between">
          <div className="ml-4">
            <h3 className={`text-lg font-semibold text-${theme.myBlack} mb-1`}>
              텍스트 필터링 설정
            </h3>
            <p className={`text-sm text-${theme.myGrey}`}>
              AI 기반 텍스트 필터링이 적용됩니다.
            </p>
          </div>
          <div className="mr-8">
            <ToggleButton isOn={enabled} onToggle={onToggleEnabled} />
          </div>
        </div>
      </div>

      {/* 원본 보기 */}
      <div className={`p-4 rounded-3xl bg-${theme.myBoxGrey} mb-8`}>
        <div className="flex items-center justify-between">
          <div className="ml-4">
            <h3 className={`text-lg font-semibold text-${theme.myBlack} mb-1`}>
              클릭 시 원본 보기
            </h3>
            <p className={`text-sm text-${theme.myGrey}`}>
              AI가 텍스트를 가려서 표시하며, 클릭 시 원본을 확인할 수 있습니다.
            </p>
          </div>
          <div className="mr-8">
            <ToggleButton
              isOn={originalViewEnabled}
              onToggle={onToggleOriginalView}
            />
          </div>
        </div>
      </div>

      {/* 개별 카테고리 */}
      <div className={`rounded-3xl bg-${theme.myBoxGrey} overflow-hidden`}>
        {ALL_TEXT_CATEGORIES.map((cat, idx, arr) => (
          <div
            key={cat}
            className={`flex items-center py-4 px-8 ${
              idx < arr.length - 1 ? 'border-b border-gray-200' : ''
            }`}
          >
            <span className={`text-xl text-${theme.myBlack} ml-2`}>
              {CATEGORY_LABELS[cat]}
            </span>
            <div className="ml-auto mr-2 flex items-center">
              <ToggleButton
                isOn={categories.includes(cat)}
                onToggle={() => onToggleCategory(cat)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 스낵바 */}
      <SnackBar
        isVisible={showSnackbar}
        message={getSnackbarMessage()}
        onConfirm={onConfirm}
      />
    </div>
  );
};

export default TextFiltering;
