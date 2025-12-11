// src/utils/commitSettings.ts
import {
  type Settings,
  type ImageFilterSettings,
  type TextFilterSettings,
} from './settings';

/**
 * 서버가 요구하는 최종 전송 스키마
 */
type OutgoingSettingsDoc = {
  type: 'settingsDoc';
  settings: {
    serviceEnabled: boolean;
    showIcon: boolean;
    filteringEnabled: boolean;
    filterImage: ImageFilterSettings;
    filterText: TextFilterSettings;
  };
  __meta: { updatedAt: string };
};

/** 옵션 필드가 있어도 서버로 보낼 때는 완전한(required) 형태로 보정 */
function normalizeImage(
  base?: Partial<ImageFilterSettings>,
  patch?: Partial<ImageFilterSettings>,
): ImageFilterSettings {
  const enabled = (patch?.enabled ?? base?.enabled ?? true) as boolean;
  const originalViewEnabled = (patch?.originalViewEnabled ??
    base?.originalViewEnabled ??
    true) as boolean;
  const categories = enabled ? patch?.categories ?? base?.categories ?? [] : [];
  return { enabled, originalViewEnabled, categories };
}

function normalizeText(
  base?: Partial<TextFilterSettings>,
  patch?: Partial<TextFilterSettings>,
): TextFilterSettings {
  const enabled = (patch?.enabled ?? base?.enabled ?? true) as boolean;
  const originalViewEnabled = (patch?.originalViewEnabled ??
    base?.originalViewEnabled ??
    true) as boolean;
  const categories = enabled ? patch?.categories ?? base?.categories ?? [] : [];
  return { enabled, originalViewEnabled, categories };
}

/** Settings → 서버 전송용 문서 */
function toOutgoingDoc(s: Settings): OutgoingSettingsDoc {
  return {
    type: 'settingsDoc',
    settings: {
      serviceEnabled: s.serviceEnabled !== false,
      showIcon: s.showIcon !== false,
      filteringEnabled: s.filteringEnabled !== false,
      filterImage: normalizeImage(undefined, s.filterImage),
      filterText: normalizeText(undefined, s.filterText),
    },
    __meta: { updatedAt: new Date().toISOString() },
  };
}

/** ACK 타입 정의 */
export type CommitAck = { ok: boolean } & Record<string, unknown>;

/**
 * 설정 커밋: 오프스크린에 릴레이 → 소켓으로 "settings-update" 전송
 * 주의: 서버는 emit ACK 콜백이 아니라 별도 이벤트("setting-updated"/"settings-updated")로 응답함
 */
export async function commitSettingsUpdate(settings: Settings) {
  const payload = toOutgoingDoc(settings);

  return new Promise<CommitAck>((resolve) => {
    chrome.runtime.sendMessage(
      {
        topic: 'OFFSCREEN:SOCKET_EMIT',
        event: 'settings-update', // 서버 이벤트명
        data: payload, // 최종 JSON
        timeoutMs: 7000,
      },
      (ack) => {
        // 여기로는 아무 것도 안 올 수 있음(ACK 사용 안함). 그래도 콘솔은 남겨둠.
        console.log('📥 commitSettingsUpdate ack (may be undefined):', ack);
        resolve(ack ?? { ok: true }); // 오프스크린에서 실제 결과를 다시 push로 알려줌
      },
    );
  });
}
