// src/utils/settings.ts
import { storage } from './chromeStore';

/** ===== 카테고리 타입 ===== */
export type ImageFilterCategory =
  | 'CRIME'
  | 'ACCIDENT'
  | 'HORROR'
  | 'GORE'
  | 'SEXUAL';

export type TextFilterCategory =
  | 'POLITICS'
  | 'INSULT'
  | 'SEXUAL'
  | 'AD'
  | 'VIOLENCE';

export const ALL_IMAGE_CATEGORIES: ImageFilterCategory[] = [
  'CRIME',
  'ACCIDENT',
  'HORROR',
  'GORE',
  'SEXUAL',
];

export const ALL_TEXT_CATEGORIES: TextFilterCategory[] = [
  'POLITICS',
  'INSULT',
  'SEXUAL',
  'AD',
  'VIOLENCE',
];

/** ===== 하위 타입 ===== */
export interface ImageFilterSettings {
  enabled: boolean;
  originalViewEnabled: boolean;
  categories: ImageFilterCategory[];
}

export interface TextFilterSettings {
  enabled: boolean;
  originalViewEnabled: boolean;
  categories: TextFilterCategory[];
}

/** ===== 루트 Settings ===== */
export interface Settings {
  serviceEnabled?: boolean;
  showIcon?: boolean;
  filteringEnabled?: boolean;
  filterImage?: ImageFilterSettings;
  filterText?: TextFilterSettings;
}

/** ===== 메타/문서 ===== */
type Meta = { updatedAt: number; source?: 'local' | 'sync' | 'app' };
type SettingsDoc = { settings: Settings; __meta: Meta };

const KEY = 'settingsDoc';
const LOCAL_OVERRIDE_KEY = 'settingsOverrideDoc';

/** 기본값 */
const IMG_DEFAULTS: ImageFilterSettings = {
  enabled: true,
  originalViewEnabled: true,
  categories: [...ALL_IMAGE_CATEGORIES],
};

const TXT_DEFAULTS: TextFilterSettings = {
  enabled: true,
  originalViewEnabled: true,
  categories: [...ALL_TEXT_CATEGORIES],
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
    filterImage: {
      ...IMG_DEFAULTS,
      ...(s.filterImage || {}),
      categories:
        s.filterImage?.enabled === false
          ? []
          : s.filterImage?.categories ?? IMG_DEFAULTS.categories,
    },
    filterText: {
      ...TXT_DEFAULTS,
      ...(s.filterText || {}),
      categories:
        s.filterText?.enabled === false
          ? []
          : s.filterText?.categories ?? TXT_DEFAULTS.categories,
    },
  };
}

function withMeta(s: Settings, meta: Partial<Meta> = {}): SettingsDoc {
  return {
    settings: normalize(s),
    __meta: { updatedAt: now(), source: 'app', ...meta },
  };
}

/** get() 결과에서 안전하게 문서를 뽑아오는 유틸 */
function pickDoc(obj: unknown, key = KEY): SettingsDoc | null {
  if (!obj || typeof obj !== 'object') return null;
  const rec = obj as Record<string, unknown>;
  const raw = rec[key];
  if (!raw || typeof raw !== 'object') return null;

  const maybe = raw as Partial<SettingsDoc>;
  if (!maybe.settings || !maybe.__meta) return null;
  return maybe as SettingsDoc;
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

/** 앱 시작 시 병합/정합 확보 */
export async function initSettings(): Promise<Settings> {
  const [localRaw, syncRaw, overrideRaw] = await Promise.all([
    storage.get<Record<string, unknown> | null>('local', KEY),
    storage.get<Record<string, unknown> | null>('sync', KEY),
    storage.get<Record<string, unknown> | null>('local', LOCAL_OVERRIDE_KEY),
  ]);

  const localDoc = pickDoc(localRaw ?? undefined);
  const syncDoc = pickDoc(syncRaw ?? undefined);
  const overrideDoc = pickDoc(overrideRaw ?? undefined, LOCAL_OVERRIDE_KEY);

  const winner: SettingsDoc = overrideDoc ?? newer(localDoc, syncDoc);
  const candidate = winner ? winner.settings : normalize({});

  const sealed = withMeta(candidate, { source: 'app' });
  await writeBoth(sealed);

  if (overrideDoc) {
    await storage.remove('local', LOCAL_OVERRIDE_KEY);
  }

  return sealed.settings;
}

/** 현재 설정 읽기 */
export async function getSettings(): Promise<Settings> {
  const raw = await storage.get<Record<string, unknown> | null>('local', KEY);
  const doc = pickDoc(raw ?? undefined);
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
export async function updateSettings(
  patch: Partial<Settings>,
): Promise<Settings> {
  const current = await getSettings();

  const merged: Settings = normalize({
    ...current,
    ...patch,
    filterImage: {
      ...IMG_DEFAULTS,
      ...(current.filterImage ?? {}),
      ...(patch.filterImage ?? {}),
    },
    filterText: {
      ...TXT_DEFAULTS,
      ...(current.filterText ?? {}),
      ...(patch.filterText ?? {}),
    },
  });

  await setSettings(merged);
  return merged;
}

/** 디버그 */
export async function debugDumpSettings() {
  const [localAll, syncAll] = await Promise.all([
    storage.get<Record<string, unknown> | null>('local', null),
    storage.get<Record<string, unknown> | null>('sync', null),
  ]);
  console.group('[DEBUG] storage snapshot');
  console.log('LOCAL(all):', localAll ?? {});
  console.log('SYNC(all):', syncAll ?? {});
  console.groupEnd();
}
