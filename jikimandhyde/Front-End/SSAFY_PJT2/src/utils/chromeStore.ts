// src/utils/chromeStore.ts
function wrap<T>(fn: (cb: (res: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      fn((res: T) => {
        const err = chrome.runtime?.lastError;
        if (err) {
          console.error('[storage] lastError:', err.message);
          reject(new Error(err.message));
          return;
        }
        resolve(res);
      });
    } catch (e) {
      reject(e);
    }
  });
}

type StorageArea = 'sync' | 'local';

export const storage = {
  async get<T = unknown>(
    area: StorageArea,
    keys: string | string[] | null,
  ): Promise<T> {
    return wrap<T>((cb) => {
      // ⬇️ 여기서만 한 줄 캐스팅
      (
        chrome.storage[area].get as (
          keys: string | string[] | null,
          cb: (items: unknown) => void,
        ) => void
      )(keys ?? null, (items) => cb(items as T));
    });
  },

  async set(area: StorageArea, items: Record<string, unknown>): Promise<void> {
    return wrap<void>((cb) => {
      (
        chrome.storage[area].set as (
          items: Record<string, unknown>,
          cb: () => void,
        ) => void
      )(items, cb);
    });
  },

  async remove(area: StorageArea, keys: string | string[]): Promise<void> {
    return wrap<void>((cb) => {
      (
        chrome.storage[area].remove as (
          keys: string | string[],
          cb: () => void,
        ) => void
      )(keys, cb);
    });
  },
};
