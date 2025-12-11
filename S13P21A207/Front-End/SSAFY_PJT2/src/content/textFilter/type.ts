// src/content/textFilter/type.ts

/**
 * 텍스트 노드 정보 저장
 * id: Map의 키
 * content: 텍스트 내용
 */
export interface TextNodeInfo {
  id: string;
  content: string;
}

export interface TextFilterRequestInfo {
  elementId: string;
  content: string;
  pageUrl: string;
  elementMetadata: TextNodeMetadata;
}

export interface TextNodeMetadata {
  elementId: string;
  tagName: 'span';
}

// --------------------
// 요청
// --------------------
export interface UserSettingsRequest {
  type: 'settingsDoc';
  settings: UserSettings & {
    filterText: TextFilterSettings;
    filterImage: ImageFilterSettings;
  };
  __meta: SettingsMeta;
}

export interface UserSettings {
  serviceEnabled: boolean;
  showIcon: boolean;
  filteringEnabled: boolean;
}

export interface FilterSettings<T = string> {
  enabled: boolean;
  originalViewEnabled: boolean;
  categories: T[];
}

// 라벨 타입
export type TextFilterCategory =
  | 'INSULT'
  | 'VIOLENCE'
  | 'SEXUAL'
  | 'AD'
  | 'POLITICS'
  | 'CLEAN';

export type ImageFilterCategory =
  | 'CRIME'
  | 'HORROR'
  | 'SEXUAL'
  | 'GORE'
  | 'ACCIDENT'
  | 'CLEAN';

export type TextFilterSettings = FilterSettings<TextFilterCategory>;
export type ImageFilterSettings = FilterSettings<ImageFilterCategory>;

interface SettingsMeta {
  updatedAt: string; // ISO 날짜 문자열
}

// --------------------
// 응답
// --------------------

export interface FilteredIndex {
  start: number;
  end: number;
  type: string[];
  confidence: number;
}

export interface TextResult {
  elementId: string;
  filteredIndexes: FilteredIndex[];
  originalLength: number;
  processedAt: string;
  processingTime: number;
}

export interface TextAnalysisResponse {
  processingTime: number;
  processedAt: string;
  results: TextResult[];
}
