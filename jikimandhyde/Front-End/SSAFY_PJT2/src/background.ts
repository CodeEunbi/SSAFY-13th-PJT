// let isIconEnabled = true;
// let isSyncEnabled = true;

// type PortMap = {
//   content: Map<number, chrome.runtime.Port>; // tabId -> port
//   offscreen: chrome.runtime.Port | null;
// };
// const ports: PortMap = { content: new Map(), offscreen: null };


// const updateIconVisibility = () => {
//   chrome.action.enable(); // 팝업은 항상 접근 가능
//   console.log(`[BG] 플로팅 아이콘 버튼 ${isIconEnabled ? "활성화" : "비활성화"}`);
// };

// const performSync = async () => {
//   try {
//     console.log("[BG] 동기화 시작");
//     const result = await chrome.storage.sync.get(null);
//     console.log("[BG] 동기화된 데이터:", result);
//     console.log("[BG] 동기화 완료");
//   } catch (error) {
//     console.error("[BG] 동기화 실패:", error);
//   }
// };

// const loadSettingsAndUpdate = async () => {
//   try {
//     const result = await chrome.storage.sync.get(["settings"]);
//     const settings = result.settings || {};
//     isIconEnabled = settings.showIcon !== false;
//     isSyncEnabled = settings.syncEnabled !== false;
//     updateIconVisibility();
//     if (isSyncEnabled) await performSync();
//   } catch (error) {
//     console.error("[BG] 설정 로드 실패:", error);
//     isIconEnabled = true;
//     isSyncEnabled = true;
//     updateIconVisibility();
//   }
// };

// chrome.runtime.onInstalled.addListener(async () => {
//   console.log("[BG] Extension installed");
//   await loadSettingsAndUpdate();
//   await ensureOffscreen();
// });

// chrome.storage.onChanged.addListener((changes, namespace) => {
//   if (namespace === "sync" && changes.settings) {
//     const n = changes.settings.newValue || {};
//     const o = changes.settings.oldValue || {};
//     if (n.showIcon !== o.showIcon) {
//       isIconEnabled = n.showIcon !== false;
//       updateIconVisibility();
//       console.log("[BG] 아이콘 설정 변경:", isIconEnabled);
//     }
//     if (n.syncEnabled !== o.syncEnabled) {
//       isSyncEnabled = n.syncEnabled !== false;
//       console.log("[BG] 동기화 설정 변경:", isSyncEnabled);
//       if (isSyncEnabled) performSync();
//     }
//   }
// });

// chrome.runtime.onMessage.addListener((msg) => {
//   if (msg?.type === "OPEN_OPTIONS") {
//     console.log("[BG] OPEN_OPTIONS");
//     chrome.runtime.openOptionsPage();
//   }
// });

// // ---- CV metrics sink (선택적으로 유지) ----
// // chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
// //   if (msg?.type === "CV_METRIC") {
// //     chrome.storage.local.get({ cv_metrics: [] }, (res) => {
// //       const arr = Array.isArray(res.cv_metrics) ? res.cv_metrics : [];
// //       arr.push(msg.payload);
// //       chrome.storage.local.set({ cv_metrics: arr }, () => {
// //         console.log("[BG] CV_METRIC stored:", msg.payload.url, msg.payload.elapsedFromNavMs, "ms");
// //         sendResponse({ ok: true });
// //       });
// //     });
// //     return true;
// //   }
// // });

// // ================== Offscreen 브리지 ==================
// const OFF_URL = chrome.runtime.getURL("src/offscreen/offscreen.html");

// // content 탭 포트 레지스트리
// // const contentPorts = new Map<number, chrome.runtime.Port>(); // tabId -> port

// // offscreen 포트 & 대기 큐
// // let offscreenPort: chrome.runtime.Port | null = null;
// // type ObsBatch = { kind: "OBS_BATCH"; pageUrl: string; items: any[]; _fromTabId?: number };
// // const pendingToOffscreen: ObsBatch[] = [];

// /** Offscreen 문서 보장 */
// async function ensureOffscreen() {
//   if (!("offscreen" in chrome)) {
//     console.error(
//       "[BG] chrome.offscreen unavailable. Check Chrome version (>=109) and 'offscreen' permission in manifest."
//     );
//     return;
//   }
//   try {
//     // @ts-ignore
//     const has = await chrome.offscreen.hasDocument?.();
//     if (has) {
//       console.log("[BG] offscreen already present");
//       return;
//     }
//     console.log("[BG] creating offscreen:", OFF_URL);
//     await chrome.offscreen.createDocument({
//       url: OFF_URL,
//       reasons: ["BLOBS"], // 필요시 'DOM_PARSER' 등 추가
//       justification: "Maintain persistent WebSocket for real-time filtering decisions",
//     });
//     console.log("[BG] offscreen created");
//   } catch (e) {
//     console.error("[BG] offscreen create failed:", e, chrome.runtime.lastError);
//   }
// }

// // 서비스 워커 기동/재기동 시에도 보장
// chrome.runtime.onStartup?.addListener(async () => {
//   await ensureOffscreen();
// });

// // ================== 포트 라우팅 ==================

// chrome.runtime.onConnect.addListener((p) => {
//   if (p.name === "cv-content") {
//     // (선택) 혹시 offscreen이 아직 없으면 보장 시도
//     if (!ports.offscreen) { ensureOffscreen(); }

//     p.onMessage.addListener((msg) => {
//       // content -> offscreen
//       ports.offscreen?.postMessage({ ...msg, tabId: (p.sender?.tab?.id ?? -1) });
//     });

//     p.onDisconnect.addListener(() => {
//       const entry = [...ports.content.entries()].find(([_, port]) => port === p);
//       if (entry) ports.content.delete(entry[0]);
//     });

//     if (p.sender?.tab?.id != null) ports.content.set(p.sender.tab.id, p);

//   } else if (p.name === "cv-offscreen") {
//     ports.offscreen = p;

//     p.onMessage.addListener((msg) => {
//       // offscreen -> content (탭 타깃팅 우선)
//       const tabId = (msg.tabId ?? p.sender?.tab?.id) as number | undefined;
//       if (tabId && ports.content.has(tabId)) {
//         ports.content.get(tabId)!.postMessage(msg);
//       } else {
//         // 브로드캐스트 (대상 모르면 전체 전송)
//         ports.content.forEach(cp => cp.postMessage(msg));
//       }
//     });

//     p.onDisconnect.addListener(() => { if (ports.offscreen === p) ports.offscreen = null; });
//   }
// });


// // chrome.runtime.onConnect.addListener(async (port) => {
// //   // --- content 쪽 포트 ---
// //   if (port.name === "cv-content") {
// //     await ensureOffscreen();
// //     const tabId = port.sender?.tab?.id ?? 0;
// //     contentPorts.set(tabId, port);

// //     port.onMessage.addListener((msg) => {
// //       // content -> offscreen 방향
// //       if (msg?.kind === "OBS_BATCH") {
// //         const batch: ObsBatch = { ...msg, _fromTabId: tabId };
// //         if (offscreenPort) offscreenPort.postMessage(batch);
// //         else pendingToOffscreen.push(batch);
// //         return;
// //       }

// //       // 수동 ping 전달 (content → BG → offscreen)
// //       if (msg?.type === "send_ping") {
// //         offscreenPort?.postMessage(msg);
// //         return;
// //       }

// //       // request/response 라우팅이 필요하다면 채널 구분해 전달
// //       if (msg?.type === "request") {
// //         // 예: { type:"request", channel, payload, reqId, _fromTabId }
// //         offscreenPort?.postMessage({ ...msg, _fromTabId: tabId });
// //         return;
// //       }
// //     });

// //     port.onDisconnect.addListener(() => {
// //       contentPorts.delete(tabId);
// //     });

// //     return;
// //   }

// //   // --- offscreen 쪽 포트 ---
// //   if (port.name === "cv-offscreen") {
// //     offscreenPort = port;
// //     console.log("[BG] offscreen port connected");

// //     // 대기 큐 비우기
// //     if (pendingToOffscreen.length) {
// //       pendingToOffscreen.splice(0).forEach((b) => offscreenPort!.postMessage(b));
// //     }

// //     port.onMessage.addListener((msg) => {
// //       // 타게팅: {_toTabId, payload}
// //       if (msg?._toTabId && contentPorts.has(msg._toTabId)) {
// //         contentPorts.get(msg._toTabId)!.postMessage(msg);
// //         return;
// //       }

// //       // 브로드캐스트: payload만 있는 경우
// //       if (msg?.payload) {
// //         contentPorts.forEach((p) => p.postMessage(msg));
// //         return;
// //       }

// //       // 요청-응답 에코: { reqId, ok, data, _toTabId? }
// //       if (msg?.reqId) {
// //         if (msg._toTabId && contentPorts.has(msg._toTabId)) {
// //           contentPorts.get(msg._toTabId)!.postMessage(msg);
// //         } else {
// //           contentPorts.forEach((p) => p.postMessage(msg)); // 대상 모르면 전체
// //         }
// //         return;
// //       }

// //       // 기타 WS 메시지 브로드캐스트(디버깅용)
// //       if (msg?.type === "ws_message") {
// //         contentPorts.forEach((p) => p.postMessage(msg));
// //       }
// //     });

// //     port.onDisconnect.addListener(() => {
// //       offscreenPort = null;
// //       console.warn("[BG] offscreen port disconnected");
// //     });
// //   }
// // });

let isIconEnabled = true;
let isSyncEnabled = true;

type PortMap = {
  content: Map<number, chrome.runtime.Port>; // tabId -> port
  offscreen: chrome.runtime.Port | null;
};
const ports: PortMap = { content: new Map(), offscreen: null };

const updateIconVisibility = () => {
  chrome.action.enable();
  console.log(`[BG] 플로팅 아이콘 버튼 ${isIconEnabled ? "활성화" : "비활성화"}`);
};

const performSync = async () => {
  try {
    console.log("[BG] 동기화 시작");
    const result = await chrome.storage.sync.get(null);
    console.log("[BG] 동기화된 데이터:", result);
    console.log("[BG] 동기화 완료");
  } catch (error) {
    console.error("[BG] 동기화 실패:", error);
  }
};

const loadSettingsAndUpdate = async () => {
  try {
    const result = await chrome.storage.sync.get(["settings"]);
    const settings = result.settings || {};
    isIconEnabled = settings.showIcon !== false;
    isSyncEnabled = settings.syncEnabled !== false;
    updateIconVisibility();
    if (isSyncEnabled) await performSync();
  } catch (error) {
    console.error("[BG] 설정 로드 실패:", error);
    isIconEnabled = true;
    isSyncEnabled = true;
    updateIconVisibility();
  }
};

chrome.runtime.onInstalled.addListener(async () => {
  console.log("[BG] Extension installed");
  await loadSettingsAndUpdate();
  await ensureOffscreen();
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.settings) {
    const n = changes.settings.newValue || {};
    const o = changes.settings.oldValue || {};
    if (n.showIcon !== o.showIcon) {
      isIconEnabled = n.showIcon !== false;
      updateIconVisibility();
      console.log("[BG] 아이콘 설정 변경:", isIconEnabled);
    }
    if (n.syncEnabled !== o.syncEnabled) {
      isSyncEnabled = n.syncEnabled !== false;
      console.log("[BG] 동기화 설정 변경:", isSyncEnabled);
      if (isSyncEnabled) performSync();
    }
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "OPEN_OPTIONS") chrome.runtime.openOptionsPage();
});

// ---------- Offscreen 보장 ----------
const OFF_URL = chrome.runtime.getURL("src/offscreen/offscreen.html");

async function ensureOffscreen() {
  if (!("offscreen" in chrome)) {
    console.error("[BG] offscreen unavailable. Need Chrome >=109 & 'offscreen' perm.");
    return;
  }
  try {
    // @ts-ignore
    const has = await chrome.offscreen.hasDocument?.();
    if (has) return;
    console.log("[BG] creating offscreen:", OFF_URL);
    await chrome.offscreen.createDocument({
      url: OFF_URL,
      reasons: ["BLOBS"],
      justification: "Maintain Socket.IO connection for real-time filtering",
    });
  } catch (e) {
    console.error("[BG] offscreen create failed:", e, chrome.runtime.lastError);
  }
}
chrome.runtime.onStartup?.addListener(ensureOffscreen);

// ---------- 포트 라우팅 ----------
chrome.runtime.onConnect.addListener((p) => {
  if (p.name === "cv-content") {
    if (!ports.offscreen) ensureOffscreen();

    p.onMessage.addListener((msg) => {
      // content → offscreen
      ports.offscreen?.postMessage({ ...msg, tabId: (p.sender?.tab?.id ?? -1) });
    });

    p.onDisconnect.addListener(() => {
      const entry = [...ports.content.entries()].find(([_, port]) => port === p);
      if (entry) ports.content.delete(entry[0]);
    });

    if (p.sender?.tab?.id != null) ports.content.set(p.sender.tab.id, p);

  } else if (p.name === "cv-offscreen") {
    ports.offscreen = p;

    p.onMessage.addListener((msg) => {
      // offscreen → content (탭 타깃 우선)
      const tabId = (msg.tabId ?? p.sender?.tab?.id) as number | undefined;
      if (tabId && ports.content.has(tabId)) {
        ports.content.get(tabId)!.postMessage(msg);
      } else {
        ports.content.forEach(cp => cp.postMessage(msg)); // 브로드캐스트
      }
    });

    p.onDisconnect.addListener(() => { if (ports.offscreen === p) ports.offscreen = null; });
  }
});

