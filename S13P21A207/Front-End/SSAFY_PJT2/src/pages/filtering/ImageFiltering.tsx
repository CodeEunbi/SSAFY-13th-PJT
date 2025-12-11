import React, { useEffect, useState, useCallback, useRef } from 'react';
import ToggleButton from '../../components/commons/ToggleButton';
import SnackBar from '../../components/commons/SnackBar';
import { useToggleChanges } from '../../hooks/useToggleChanges';
import { theme } from '../../styles/theme';
import {
  getSettings,
  initSettings,
  updateSettings, // 추가: ACK 시 영구 저장
  type Settings, // 전체 Settings 타입
  type ImageFilterSettings,
  type ImageFilterCategory,
  ALL_IMAGE_CATEGORIES,
} from '../../utils/settings';
import { commitSettingsUpdate } from '../../utils/commitSettings';

const IMG_DEFAULTS: ImageFilterSettings = {
  enabled: true,
  originalViewEnabled: true,
  categories: [...ALL_IMAGE_CATEGORIES],
};

const CATEGORY_LABELS: Record<ImageFilterCategory, string> = {
  CRIME: '범죄',
  ACCIDENT: '참사',
  HORROR: '공포',
  GORE: '고어',
  SEXUAL: '성적 컨텐츠',
};

const ImageFiltering: React.FC = () => {
  const [loading, setLoading] = useState(true);

  // UI state
  const [enabled, setEnabled] = useState<boolean>(IMG_DEFAULTS.enabled);
  const [originalViewEnabled, setOriginalViewEnabled] = useState<boolean>(
    IMG_DEFAULTS.originalViewEnabled,
  );
  const [categories, setCategories] = useState<ImageFilterCategory[]>(
    IMG_DEFAULTS.categories,
  );

  // 원본(ACK 성공 시에만 갱신)
  const [origEnabled, setOrigEnabled] = useState<boolean>(IMG_DEFAULTS.enabled);
  const [origOriginalViewEnabled, setOrigOriginalViewEnabled] =
    useState<boolean>(IMG_DEFAULTS.originalViewEnabled);
  const [origCategories, setOrigCategories] = useState<ImageFilterCategory[]>(
    IMG_DEFAULTS.categories,
  );

  // 추가: 서버에 보낸 "완전한 Settings"를 보관 → ACK 시 저장
  const pendingSaveRef = useRef<Settings | null>(null);

  const { showSnackbar, addPendingChange, confirmChanges, getSnackbarMessage } =
    useToggleChanges();

  // 초기 로드
  useEffect(() => {
    (async () => {
      await initSettings();
      const s = await getSettings();
      const loaded: ImageFilterSettings = {
        ...IMG_DEFAULTS,
        ...(s.filterImage ?? {}),
        categories:
          s.filterImage?.enabled === false
            ? []
            : s.filterImage?.categories ?? IMG_DEFAULTS.categories,
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

  // 추가: 오프스크린 → 서버 푸시 이벤트 수신 (성공/실패 처리)
  useEffect(() => {
    const onMsg = async (msg: any) => {
      if (msg?.topic === 'OFFSCREEN:SETTINGS_ACK') {
        if (pendingSaveRef.current) {
          try {
            await updateSettings(pendingSaveRef.current); // 영구 저장
            const fin = pendingSaveRef.current;
            // UI 확정 반영
            const img = fin.filterImage ?? IMG_DEFAULTS;
            setEnabled(!!img.enabled);
            setOriginalViewEnabled(!!img.originalViewEnabled);
            setCategories(img.categories ?? []);

            setOrigEnabled(!!img.enabled);
            setOrigOriginalViewEnabled(!!img.originalViewEnabled);
            setOrigCategories(img.categories ?? []);
          } finally {
            pendingSaveRef.current = null;
          }
        }
        confirmChanges();
      }

      if (msg?.topic === 'OFFSCREEN:SETTINGS_ERROR') {
        // 실패 시 저장된 값을 다시 불러와 복구
        const cur = await getSettings();
        const img = {
          ...IMG_DEFAULTS,
          ...(cur.filterImage ?? {}),
          categories:
            cur.filterImage?.enabled === false
              ? []
              : cur.filterImage?.categories ?? IMG_DEFAULTS.categories,
        };
        setEnabled(img.enabled);
        setOriginalViewEnabled(img.originalViewEnabled);
        setCategories(img.categories);

        setOrigEnabled(img.enabled);
        setOrigOriginalViewEnabled(img.originalViewEnabled);
        setOrigCategories(img.categories);

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
        if (s?.filterImage) {
          const img: ImageFilterSettings = {
            ...IMG_DEFAULTS,
            ...s.filterImage,
            categories:
              s.filterImage.enabled === false
                ? []
                : s.filterImage.categories ?? [],
          };
          setEnabled(img.enabled);
          setOriginalViewEnabled(img.originalViewEnabled);
          setCategories(img.categories);
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
    addPendingChange('image.enabled', next, origEnabled, () =>
      Promise.resolve(),
    );
    if (!next) {
      setCategories([]);
    } else if (categories.length === 0) {
      setCategories([...ALL_IMAGE_CATEGORIES]);
    }
  }, [enabled, origEnabled, categories, addPendingChange]);

  const onToggleOriginalView = useCallback(() => {
    const next = !originalViewEnabled;
    setOriginalViewEnabled(next);
    addPendingChange(
      'image.originalViewEnabled',
      next,
      origOriginalViewEnabled,
      () => Promise.resolve(),
    );
  }, [originalViewEnabled, origOriginalViewEnabled, addPendingChange]);

  const onToggleCategory = useCallback(
    (cat: ImageFilterCategory) => {
      let nextCats: ImageFilterCategory[];
      if (categories.includes(cat)) {
        nextCats = categories.filter((c) => c !== cat);
      } else {
        nextCats = [...categories, cat];
      }
      setCategories(nextCats);

      const wasOn = origCategories.includes(cat);
      addPendingChange(
        `image.category.${cat}`,
        nextCats.includes(cat),
        wasOn,
        () => Promise.resolve(),
      );
    },
    [categories, origCategories, addPendingChange],
  );

  // --- 확인: 한 번에 소켓 커밋 ---
  const onConfirm = useCallback(async () => {
    // 1) 현재 저장된 전체 설정을 읽어와 이미지 설정만 덮어쓴다 (다른 페이지 설정 보존)
    const current = await getSettings();
    const full: Settings = {
      ...current,
      filterImage: {
        enabled,
        originalViewEnabled,
        categories: enabled ? categories : [],
      },
    };

    console.log('[OPTIONS][IMG] commit start', full);

    // 2) 보낸 값 보관 → ACK에서 영구 저장/확정
    pendingSaveRef.current = full;

    // 3) 소켓 커밋 (성공 확정은 ACK에서 처리)
    const res = await commitSettingsUpdate(full);

    // 4) emit 자체 실패(전송 에러)만 즉시 복구
    if (!res?.ok) {
      const cur = await getSettings();
      const img = {
        ...IMG_DEFAULTS,
        ...(cur.filterImage ?? {}),
        categories:
          cur.filterImage?.enabled === false
            ? []
            : cur.filterImage?.categories ?? IMG_DEFAULTS.categories,
      };
      setEnabled(img.enabled);
      setOriginalViewEnabled(img.originalViewEnabled);
      setCategories(img.categories);
      pendingSaveRef.current = null;
      confirmChanges();
    }
  }, [enabled, originalViewEnabled, categories, confirmChanges]);

  if (loading) return <div>불러오는 중…</div>;

  return (
    <div>
      {/* 이미지 필터링 전체 */}
      <div className={`p-4 rounded-3xl bg-${theme.myBoxGrey} mb-4`}>
        <div className="flex items-center justify-between">
          <div className="ml-4">
            <h3 className={`text-lg font-semibold text-${theme.myBlack} mb-1`}>
              이미지 필터링 설정
            </h3>
            <p className={`text-sm text-${theme.myGrey}`}>
              AI 기반 이미지 필터링 기능이 적용됩니다.
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
              필터링된 화면이 표시되며 클릭 시 원본을 확인할 수 있습니다.
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
        {ALL_IMAGE_CATEGORIES.map((cat, idx, arr) => (
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

export default ImageFiltering;
