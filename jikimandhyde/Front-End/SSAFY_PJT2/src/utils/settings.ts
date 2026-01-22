// src/utils/settings.ts
import { storage } from './chromeStore';

/** ===== 하위 타입 ===== */
export type ImageFilterSettings = {
  enabled: boolean;
  originalViewEnabled: boolean;
  crimeEnabled: boolean;
  accidentEnabled: boolean;
  horrorEnabled: boolean;
  goreEnabled: boolean;
  sexualEnabled: boolean;
};

export type TextFilterSettings = {
  enabled: boolean;
  originalViewEnabled: boolean;
  swearingEnabled: boolean;
  politicsEnabled: boolean;
  adsEnabled: boolean;
  sexualEnabled: boolean;
};

/** ===== 루트 Settings ===== */
export type Settings = {
  serviceEnabled?: boolean;
  showIcon?: boolean;
  filteringEnabled?: boolean;
  filterImage?: ImageFilterSettings;
  filterText?: TextFilterSettings;
};

/** ===== 메타/문서 ===== */
type Meta = { updatedAt: number; source?: 'local' | 'sync' | 'app' };
type SettingsDoc = { settings: Settings; __meta: Meta };

const KEY = 'settingsDoc';
const LOCAL_OVERRIDE_KEY = 'settingsOverrideDoc';

/** 기본값 */
const IMG_DEFAULTS: ImageFilterSettings = {
  enabled: true,
  originalViewEnabled: true,
  crimeEnabled: true,
  accidentEnabled: true,
  horrorEnabled: true,
  goreEnabled: true,
  sexualEnabled: true,
};

const TXT_DEFAULTS: TextFilterSettings = {
  enabled: true,
  originalViewEnabled: true,
  swearingEnabled: true,
  politicsEnabled: true,
  adsEnabled: true,
  sexualEnabled: true,
};

const ROOT_DEFAULTS: Required<
  Pick<Settings, 'serviceEnabled' | 'showIcon' | 'filteringEnabled'>
> = {
  serviceEnabled: true,
  showIcon: true,
  filteringEnabled: true,
};

const now = () => Date.now();

/** 누락 보정 */
function normalize(s: Settings): Settings {
  return {
    ...ROOT_DEFAULTS,
    ...s,
    filterImage: { ...IMG_DEFAULTS, ...(s.filterImage || {}) },
    filterText: { ...TXT_DEFAULTS, ...(s.filterText || {}) },
  };
}
function withMeta(s: Settings, meta: Partial<Meta> = {}): SettingsDoc {
  return {
    settings: normalize(s),
    __meta: { updatedAt: now(), source: 'app', ...meta },
  };
}
function pickDoc(obj: any, key = KEY): SettingsDoc | null {
  if (!obj || typeof obj !== 'object') return null;
  const doc = obj[key] as SettingsDoc | undefined;
  if (!doc || !doc.__meta || !doc.settings) return null;
  return doc;
}
async function writeBoth(doc: SettingsDoc) {
  await Promise.all([
    storage.set('local', { [KEY]: doc }),
    storage.set('sync', { [KEY]: doc }),
  ]);
}
function newer(a: SettingsDoc | null, b: SettingsDoc | null): SettingsDoc {
  if (a && b) return a.__meta.updatedAt >= b.__meta.updatedAt ? a : b;
  if (a) return a;
  if (b) return b;
  return withMeta({});
}

/** 레거시 { settings: { filter: { image/text } } } 흡수 */
function absorbLegacy(base: Settings, legacyLike: any): Settings {
  if (!legacyLike || typeof legacyLike !== 'object') return base;

  const maybe =
    legacyLike.settings && typeof legacyLike.settings === 'object'
      ? legacyLike.settings
      : legacyLike;

  const legacyFilter =
    maybe.filter && typeof maybe.filter === 'object' ? maybe.filter : {};
  const legacyImage =
    legacyFilter.image && typeof legacyFilter.image === 'object'
      ? legacyFilter.image
      : {};
  const legacyText =
    legacyFilter.text && typeof legacyFilter.text === 'object'
      ? legacyFilter.text
      : {};

  const merged: Settings = {
    ...base,
    ...maybe,
    filterImage: { ...base.filterImage, ...legacyImage },
    filterText: { ...base.filterText, ...legacyText },
  };
  delete (merged as any).filter;
  return normalize(merged);
}

/** 앱 시작 시 병합/정합 확보 + 레거시 자동 제거 */
export async function initSettings(): Promise<Settings> {
  const [localRaw, syncRaw, overrideRaw, legacyLocal, legacySync] =
    await Promise.all([
      storage.get<any>('local', KEY),
      storage.get<any>('sync', KEY),
      storage.get<any>('local', LOCAL_OVERRIDE_KEY),
      storage.get<any>('local', 'settings'), // 레거시
      storage.get<any>('sync', 'settings'), // 레거시
    ]);

  const localDoc = pickDoc(localRaw);
  const syncDoc = pickDoc(syncRaw);
  const overrideDoc = pickDoc(overrideRaw, LOCAL_OVERRIDE_KEY);

  // eslint-disable-next-line prefer-const
  let winner: SettingsDoc = overrideDoc ?? newer(localDoc, syncDoc);

  let candidate = winner ? winner.settings : normalize({});
  candidate = absorbLegacy(candidate, legacyLocal);
  candidate = absorbLegacy(candidate, legacySync);

  // 레거시 키 자동 삭제 (양쪽 영역)
  await Promise.all([
    storage.remove('local', 'settings'),
    storage.remove('sync', 'settings'),
  ]);

  const sealed = withMeta(candidate, { source: 'app' });
  await writeBoth(sealed);

  // override는 1회성
  if (overrideDoc) {
    await storage.remove('local', LOCAL_OVERRIDE_KEY);
  }

  return sealed.settings;
}

/** 현재 설정 읽기 */
export async function getSettings(): Promise<Settings> {
  const raw = await storage.get<any>('local', KEY);
  const doc = pickDoc(raw);
  if (doc) return normalize(doc.settings);
  return initSettings();
}

/** 전체 저장 + override 기록 */
export async function setSettings(next: Settings): Promise<void> {
  const doc = withMeta(next, { source: 'local' });
  await Promise.all([
    storage.set('local', { [KEY]: doc }),
    storage.set('sync', { [KEY]: doc }),
    storage.set('local', { [LOCAL_OVERRIDE_KEY]: doc }),
  ]);
}

/** 부분 저장 (깊은 병합) */
// export async function updateSettings(
//   patch: Partial<Settings>,
// ): Promise<Settings> {
//   const current = await getSettings();

//   const merged: Settings = normalize({
//     ...current,
//     ...patch,
//     filterImage: { ...current.filterImage, ...(patch.filterImage || {}) },
//     filterText: { ...current.filterText, ...(patch.filterText || {}) },
//   });

//   await setSettings(merged);
//   return merged;
// }

export async function updateSettings(
  patch: Partial<Settings>,
): Promise<Settings> {
  const current = await getSettings();

  const mergedImage = {
    ...(current.filterImage ?? IMG_DEFAULTS),
    ...(patch.filterImage ?? {}),
  } as ImageFilterSettings;

  const mergedText = {
    ...(current.filterText ?? TXT_DEFAULTS),
    ...(patch.filterText ?? {}),
  } as TextFilterSettings;

  const merged: Settings = normalize({
    ...current,
    ...patch,
    filterImage: mergedImage,
    filterText: mergedText,
  });

  await setSettings(merged);
  return merged;
}


/** 디버그 */
export async function debugDumpSettings() {
  const [localAll, syncAll] = await Promise.all([
    storage.get<any>('local', null),
    storage.get<any>('sync', null),
  ]);
  console.group('[DEBUG] storage snapshot');
  console.log('LOCAL(all):', localAll);
  console.log('SYNC(all):', syncAll);
  console.groupEnd();
}
