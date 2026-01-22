import React, { useEffect, useState, useCallback } from 'react';
import ToggleButton from '../../components/commons/ToggleButton';
import SnackBar from '../../components/commons/SnackBar';
import { useToggleChanges } from '../../hooks/useToggleChanges';
import { theme } from '../../styles/theme';
import {
  getSettings,
  updateSettings,
  initSettings,
  type TextFilterSettings,
} from '../../utils/settings';

const TXT_DEFAULTS: TextFilterSettings = {
  enabled: true,
  originalViewEnabled: true,
  swearingEnabled: true,
  politicsEnabled: true,
  adsEnabled: true,
  sexualEnabled: true,
};

const TextFiltering: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<TextFilterSettings>(TXT_DEFAULTS);
  const [originalState, setOriginalState] = useState<TextFilterSettings>(TXT_DEFAULTS);
  const { 
    showSnackbar, 
    addPendingChange, 
    confirmChanges, 
    getSnackbarMessage 
  } = useToggleChanges();

  const load = useCallback(async () => {
    await initSettings();
    const s = await getSettings();
    const loadedState = { ...TXT_DEFAULTS, ...(s.filterText || {}) };
    setState(loadedState);
    setOriginalState(loadedState);
    setLoading(false);
  }, []);

  const save = useCallback(
    async (patch: Partial<TextFilterSettings>) => {
      const next = { ...state, ...patch };
      setState(next);
      await updateSettings({ filterText: next });
      setOriginalState(next);
    },
    [state],
  );

  const handleToggleChange = useCallback((key: keyof TextFilterSettings) => {
    const newValue = !state[key];
    const newState = { ...state, [key]: newValue };
    
    // UI는 즉시 업데이트
    setState(newState);
    
    // 스낵바에 변경사항 추가 (원래 상태와 비교)
    addPendingChange(
      key,
      newValue,
      originalState[key],
      () => save({ [key]: newValue })
    );
  }, [state, originalState, addPendingChange, save]);

  useEffect(() => {
    load();

    const onChanged = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if ((area === 'local' || area === 'sync') && changes.settingsDoc) {
        const s = changes.settingsDoc.newValue?.settings;
        if (s) setState({ ...TXT_DEFAULTS, ...(s.filterText || {}) });
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, [load]);

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
            <ToggleButton
              isOn={state.enabled}
              onToggle={() => handleToggleChange('enabled')}
            />
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
              isOn={state.originalViewEnabled}
              onToggle={() => handleToggleChange('originalViewEnabled')}
            />
          </div>
        </div>
      </div>

      {/* 개별 항목 */}
      <div className={`rounded-3xl bg-${theme.myBoxGrey} overflow-hidden`}>
        {(
          [
            ['욕설·비난', 'swearingEnabled'],
            ['정치', 'politicsEnabled'],
            ['광고·봇', 'adsEnabled'],
            ['성적 컨텐츠', 'sexualEnabled'],
          ] as const
        ).map(([label, key], idx, arr) => (
          <div
            key={key}
            className={`flex items-center py-4 px-8 ${
              idx < arr.length - 1 ? 'border-b border-gray-200' : ''
            }`}
          >
            <span className={`text-xl text-${theme.myBlack} ml-2`}>
              {label}
            </span>
            <div className="ml-auto mr-2 flex items-center">
              <ToggleButton
                isOn={state[key]}
                onToggle={() => handleToggleChange(key as keyof TextFilterSettings)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 스낵바 */}
      <SnackBar
        isVisible={showSnackbar}
        message={getSnackbarMessage()}
        onConfirm={confirmChanges}
      />
    </div>
  );
};

export default TextFiltering;
