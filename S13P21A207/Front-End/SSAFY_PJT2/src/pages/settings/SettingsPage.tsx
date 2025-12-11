// src/pages/settings/SettingsPage.tsx
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
} from '../../utils/settings';
import { commitSettingsUpdate } from '../../utils/commitSettings';

const DEFAULTS: Required<Pick<Settings, 'showIcon' | 'filteringEnabled'>> = {
  showIcon: true,
  filteringEnabled: true,
};

// 좁은 수신 메시지 타입(필요 키만 느슨하게 명시)
type IncomingMsg = { topic?: string; [key: string]: unknown };

const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [showIcon, setShowIcon] = useState<boolean>(DEFAULTS.showIcon);
  const [filteringEnabled, setFilteringEnabled] = useState<boolean>(
    DEFAULTS.filteringEnabled,
  );

  // 원본(확정 저장된 값) - ACK 성공 시에만 갱신
  const [originalShowIcon, setOriginalShowIcon] = useState<boolean>(
    DEFAULTS.showIcon,
  );
  const [originalFilteringEnabled, setOriginalFilteringEnabled] =
    useState<boolean>(DEFAULTS.filteringEnabled);

  // 서버에 보낸 "최종 설정"을 보관 → ACK 오면 이걸 chrome.storage에 저장
  const pendingSaveRef = useRef<Settings | null>(null);

  const { showSnackbar, addPendingChange, confirmChanges, getSnackbarMessage } =
    useToggleChanges();

  // 초기 로드 (동기화 병합 포함)
  useEffect(() => {
    (async () => {
      try {
        await initSettings();
        const s = await getSettings();
        const loadedShowIcon = s.showIcon !== false;
        const loadedFilteringEnabled = s.filteringEnabled !== false;
        setShowIcon(loadedShowIcon);
        setFilteringEnabled(loadedFilteringEnabled);
        setOriginalShowIcon(loadedShowIcon);
        setOriginalFilteringEnabled(loadedFilteringEnabled);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 오프스크린 → 서버 푸시 이벤트 수신: 성공/실패 처리
  useEffect(() => {
    const onMsg = async (msg: unknown) => {
      const m = msg as IncomingMsg;

      if (m?.topic === 'OFFSCREEN:SETTINGS_ACK') {
        // 서버 저장 성공 → chrome.storage에 최종 반영
        if (pendingSaveRef.current) {
          try {
            await updateSettings(pendingSaveRef.current);
            const s = pendingSaveRef.current;
            setOriginalShowIcon(s.showIcon !== false);
            setOriginalFilteringEnabled(s.filteringEnabled !== false);
          } finally {
            pendingSaveRef.current = null;
          }
        }
        confirmChanges();
      }

      if (m?.topic === 'OFFSCREEN:SETTINGS_ERROR') {
        if (pendingSaveRef.current) {
          setShowIcon(originalShowIcon);
          setFilteringEnabled(originalFilteringEnabled);
          pendingSaveRef.current = null;
        }
        confirmChanges();
      }
    };

    chrome.runtime.onMessage.addListener(onMsg);
    return () => chrome.runtime.onMessage.removeListener(onMsg);
  }, [confirmChanges, originalShowIcon, originalFilteringEnabled]);

  const handleFilteringToggle = useCallback(() => {
    const next = !filteringEnabled;
    setFilteringEnabled(next);
    addPendingChange('filteringEnabled', next, originalFilteringEnabled, () =>
      Promise.resolve(),
    );
  }, [filteringEnabled, originalFilteringEnabled, addPendingChange]);

  const handleIconToggle = useCallback(() => {
    const next = !showIcon;
    setShowIcon(next);

    addPendingChange('showIcon', next, originalShowIcon, () =>
      Promise.resolve(),
    );
  }, [showIcon, originalShowIcon, addPendingChange]);

  const handleConfirmAll = useCallback(async () => {
    const prev = {
      showIcon: originalShowIcon,
      filteringEnabled: originalFilteringEnabled,
    };

    const current = await getSettings();
    const fullSettings: Settings = {
      ...current,
      showIcon,
      filteringEnabled,
    };

    console.log(
      '[OPTIONS] settings commit start (single payload)',
      fullSettings,
    );

    // 성공 시에만 저장하도록, 보낸 값을 보관
    pendingSaveRef.current = fullSettings;

    const res = await commitSettingsUpdate(fullSettings);

    if (!res.ok) {
      console.error(
        '[OPTIONS] settings commit initiate failed (pre-ACK):',
        (res as Record<string, unknown>).error ||
          (res as Record<string, unknown>).server,
      );
      // 즉시 실패한 경우만 롤백
      setShowIcon(prev.showIcon);
      setFilteringEnabled(prev.filteringEnabled);
      pendingSaveRef.current = null;
      confirmChanges();
    }
  }, [
    showIcon,
    filteringEnabled,
    originalShowIcon,
    originalFilteringEnabled,
    confirmChanges,
  ]);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">일반 설정</h2>

      {loading ? (
        <div>불러오는 중…</div>
      ) : (
        <div className="space-y-4">
          {/* 필터링 활성화 */}
          <div className={`p-4 rounded-3xl bg-${theme.myBoxGrey}`}>
            <div className="flex items-center justify-between">
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-my-black mb-1">
                  필터링 활성화
                </h3>
                <p className="text-sm text-my-grey">
                  전체 필터링을 활성화합니다.
                </p>
              </div>
              <div className="mr-8">
                <ToggleButton
                  isOn={filteringEnabled}
                  onToggle={handleFilteringToggle}
                />
              </div>
            </div>
          </div>

          {/* 아이콘 버튼 활성화 */}
          <div className={`p-4 rounded-3xl bg-${theme.myBoxGrey}`}>
            <div className="flex items-center justify-between">
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-my-black mb-1">
                  아이콘 버튼 활성화
                </h3>
                <p className="text-sm text-my-grey">
                  웹페이지 왼쪽 하단의 플로팅 아이콘 버튼을 활성화합니다.
                  <br />
                  활성화 시, 왼쪽 하단에 아이콘이 뜹니다.
                </p>
              </div>
              <div className="mr-8">
                <ToggleButton isOn={showIcon} onToggle={handleIconToggle} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 스낵바 */}
      <SnackBar
        isVisible={showSnackbar}
        message={getSnackbarMessage()}
        onConfirm={handleConfirmAll}
      />
    </div>
  );
};

export default SettingsPage;
