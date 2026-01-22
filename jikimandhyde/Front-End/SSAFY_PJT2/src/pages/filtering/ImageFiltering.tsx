import React, { useEffect, useState, useCallback } from 'react';
import ToggleButton from '../../components/commons/ToggleButton';
import SnackBar from '../../components/commons/SnackBar';
import { useToggleChanges } from '../../hooks/useToggleChanges';
import { theme } from '../../styles/theme';
import {
  getSettings,
  updateSettings,
  initSettings,
  type ImageFilterSettings,
} from '../../utils/settings';

const IMG_DEFAULTS: ImageFilterSettings = {
  enabled: true,
  originalViewEnabled: true,
  crimeEnabled: true,
  accidentEnabled: true,
  horrorEnabled: true,
  goreEnabled: true,
  sexualEnabled: true,
};

const ImageFiltering: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ImageFilterSettings>(IMG_DEFAULTS);
  const [originalState, setOriginalState] = useState<ImageFilterSettings>(IMG_DEFAULTS);
  const { 
    showSnackbar, 
    addPendingChange, 
    confirmChanges, 
    getSnackbarMessage 
  } = useToggleChanges();

  const load = useCallback(async () => {
    await initSettings();
    const s = await getSettings();
    const loadedState = { ...IMG_DEFAULTS, ...(s.filterImage || {}) };
    setState(loadedState);
    setOriginalState(loadedState);
    setLoading(false);
  }, []);

  const save = useCallback(
    async (patch: Partial<ImageFilterSettings>) => {
      const next = { ...state, ...patch };
      setState(next);
      await updateSettings({ filterImage: next });
      setOriginalState(next);
    },
    [state],
  );

  const handleToggleChange = useCallback((key: keyof ImageFilterSettings) => {
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
        if (s) setState({ ...IMG_DEFAULTS, ...(s.filterImage || {}) });
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, [load]);

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
              필터링된 화면이 표시되며 클릭 시 원본을 확인할 수 있습니다.
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
            ['범죄', 'crimeEnabled'],
            ['사건사고', 'accidentEnabled'],
            ['공포', 'horrorEnabled'],
            ['고어', 'goreEnabled'],
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
                onToggle={() => handleToggleChange(key as keyof ImageFilterSettings)}
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

export default ImageFiltering;
