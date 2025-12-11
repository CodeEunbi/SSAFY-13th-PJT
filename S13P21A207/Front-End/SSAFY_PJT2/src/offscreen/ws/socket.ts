import io from "socket.io-client";

import { SOCKET_IO_BASE, SOCKET_IO_PATH } from "../../types/api";

console.log("[OFF] SOCKET_IO_BASE =", SOCKET_IO_BASE, "path", SOCKET_IO_PATH);

export const websocket = io(SOCKET_IO_BASE, {
  path: SOCKET_IO_PATH,           // ← "/socket.io"
  transports: ["websocket"],      // 폴링 끄기(CORS/권한 이슈 최소화)
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
});