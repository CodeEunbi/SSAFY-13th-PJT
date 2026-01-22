// src/content/ipc/listeners.ts


// import type { IpcEnvelope, DecisionsPayload } from "../../types/realtime";
// import { IPC_TOPICS } from "./events";

// export function registerContentListeners(port: chrome.runtime.Port) {
//   port.onMessage.addListener((msg: IpcEnvelope) => {
//     if (msg.topic === IPC_TOPICS.DECISIONS) {
//       applyBlurDecisions(msg.data as DecisionsPayload);
//     }
//   });
// }

// function applyBlurDecisions(payload: DecisionsPayload) {
//   ensureStyle();
//   payload.targets.forEach(t => {
//     const el = document.querySelector(t.selector) as HTMLElement | null;
//     if (!el) return;
//     // 문장 안전 escape
//     const safe = t.sentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//     const re = new RegExp(`(${safe})`, "g");
//     el.innerHTML = el.innerHTML.replace(
//       re,
//       `<span class="cv-blur-sent" data-cv="1" style="filter: blur(6px)">${t.sentence}</span>`
//     );
//   });
// }

// function ensureStyle() {
//   if (document.getElementById("cv-blur-style")) return;
//   const style = document.createElement("style");
//   style.id = "cv-blur-style";
//   style.textContent = `.cv-blur-sent{ background: rgba(0,0,0,.15); border-radius: 4px; }`;
//   document.documentElement.appendChild(style);
// }

// src/content/ipc/listeners.ts
import type { IpcEnvelope, DecisionsPayload } from "../../types/realtime";
import { IPC_TOPICS } from "./events";

export function registerContentListeners(port: chrome.runtime.Port) {
  port.onMessage.addListener((raw: unknown) => {
    const msg = raw as IpcEnvelope;
    if (!msg || typeof msg !== "object" || typeof msg.topic !== "string") return;

    switch (msg.topic) {
      case IPC_TOPICS.DECISIONS:
        applyBlurDecisions(msg.data as DecisionsPayload);
        break;
      case IPC_TOPICS.PONG:
        console.log("[CONTENT] pong:", msg.data);
        break;
      case IPC_TOPICS.CONFIG:
        // 런타임 설정 안 씀. 참고 로그만.
        console.log("[CONTENT] config (ignored):", msg.data);
        break;
      default:
        // 무시
        break;
    }
  });
}

function applyBlurDecisions(payload: DecisionsPayload) {
  ensureStyle();
  const total = payload.targets?.length ?? 0;

  if (!total) {
    console.log(`[CONTENT] 서버 결정: 가릴 문장 없음 (url: ${payload.url})`);
    return;
  }

  let applied = 0;
  payload.targets.forEach(t => {
    const el = document.querySelector(t.selector) as HTMLElement | null;
    if (!el) return;

    const safe = t.sentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${safe})`, "g");

    const before = el.innerHTML;
    const after = before.replace(
      re,
      `<span class="cv-blur-sent" data-cv="1" style="filter: blur(6px)">$1</span>`
    );

    if (after !== before) {
      el.innerHTML = after;
      applied++;
      console.log(`[CONTENT] 가림 적용: ${t.selector} ← "${t.sentence}"`);
    }
  });

  console.log(`[CONTENT] 최종 가림 적용 수: ${applied}/${total}`);
}

function ensureStyle() {
  if (document.getElementById("cv-blur-style")) return;
  const style = document.createElement("style");
  style.id = "cv-blur-style";
  style.textContent = `.cv-blur-sent{ background: rgba(0,0,0,.15); border-radius: 4px; }`;
  document.documentElement.appendChild(style);
}
