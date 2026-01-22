// src/pages/settings/SettingsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import ToggleButton from '../../components/commons/ToggleButton';
import SnackBar from '../../components/commons/SnackBar';
import { useToggleChanges } from '../../hooks/useToggleChanges';
import { theme } from '../../styles/theme';
import {
  getSettings,
  updateSettings,
  initSettings,
  type Settings,
} from '../../utils/settings';

const DEFAULTS: Required<Pick<Settings, 'showIcon' | 'filteringEnabled'>> = {
  showIcon: true,
  filteringEnabled: true,
};

const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [showIcon, setShowIcon] = useState<boolean>(DEFAULTS.showIcon);
  const [filteringEnabled, setFilteringEnabled] = useState<boolean>(
    DEFAULTS.filteringEnabled,
  );
  const [originalShowIcon, setOriginalShowIcon] = useState<boolean>(DEFAULTS.showIcon);
  const [originalFilteringEnabled, setOriginalFilteringEnabled] = useState<boolean>(
    DEFAULTS.filteringEnabled,
  );
  const { 
    showSnackbar, 
    addPendingChange, 
    confirmChanges, 
    getSnackbarMessage 
  } = useToggleChanges();

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

  // 실제 저장 함수들
  const saveFilteringEnabled = useCallback(async (value: boolean) => {
    setFilteringEnabled(value);
    await updateSettings({ filteringEnabled: value });
    setOriginalFilteringEnabled(value);
  }, []);

  const saveShowIcon = useCallback(async (value: boolean) => {
    setShowIcon(value);
    await updateSettings({ showIcon: value });
    setOriginalShowIcon(value);
  }, []);

  // 필터링 토글 핸들러
  const handleFilteringToggle = useCallback(() => {
    const next = !filteringEnabled;
    setFilteringEnabled(next);
    
    addPendingChange(
      'filteringEnabled',
      next,
      originalFilteringEnabled,
      () => saveFilteringEnabled(next)
    );
  }, [filteringEnabled, originalFilteringEnabled, addPendingChange, saveFilteringEnabled]);

  // 아이콘 토글 핸들러
  const handleIconToggle = useCallback(() => {
    const next = !showIcon;
    setShowIcon(next);
    
    addPendingChange(
      'showIcon',
      next,
      originalShowIcon,
      () => saveShowIcon(next)
    );
  }, [showIcon, originalShowIcon, addPendingChange, saveShowIcon]);

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
        onConfirm={confirmChanges}
      />
    </div>
  );
};

export default SettingsPage;
