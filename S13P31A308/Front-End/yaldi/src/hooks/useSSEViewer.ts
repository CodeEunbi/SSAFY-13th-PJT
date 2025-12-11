import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useWorkspace } from "../pages/workspace/WorkSpace";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// claude 개선 버전
const useViewerStream = (isViewMode: boolean, viewerLinkKeyFromParams?: string) => {
  const { replaceTables, updateTablePosition } = useWorkspace();
  // const useViewerStream = (isViewMode: boolean, viewerLinkKeyFromParams?: string) => {
  // authStore에서 key를 가져오는 대신, viewerLinkKeyFromParams를 사용하거나
  // 두 키 중 유효한 것을 사용하도록 로직을 통합할 수 있습니다.
  const authStoreViewerKey = useAuthStore((state) => state.viewerLinkKey);

  // viewerLinkKey를 결정합니다. (URL 파람 우선 또는 Auth Store 키 사용)
  const viewerLinkKey = viewerLinkKeyFromParams || authStoreViewerKey;
  // const viewerLinkKey = useAuthStore((state) => state.viewerLinkKey);


  useEffect(() => {

    if (!isViewMode || !viewerLinkKey) return;



    let eventSource: EventSource | null = null;
    let reconnectTimeout: number | null = null;

    const connect = () => {
      // 이전 재연결 타이머 제거
      if (reconnectTimeout !== null) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }


      eventSource = new EventSource(`${BASE_URL}/api/v1/viewer/${viewerLinkKey}/stream`, {
        withCredentials: true,
      });


      eventSource.addEventListener("erd-update", (event: MessageEvent) => {
        const erdData = JSON.parse(event.data);
        console.log(erdData);
        try {
          const data = JSON.parse(event.data);

          // 이벤트 타입에 따라 처리
          switch (data.eventType) {
            case 'TABLE_MOVE':
              updateTablePosition(`table-${data.tableKey}`, {
                x: data.xPosition,
                y: data.yPosition
              });
              break;
            case 'TABLE_CREATE':
            case 'TABLE_UPDATE':
            case 'TABLE_DELETE':
              // 전체 테이블 목록을 다시 받아와서 업데이트
              replaceTables(data.tables, { resetView: false });
              break;
          }
        } catch (error) {
          console.error("알림 파싱 에러:", error);
        }
      });


      eventSource.addEventListener("erd-update", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log(data)
        } catch (error) {
          console.error("알림 파싱 에러:", error);
        }
      });

      eventSource.addEventListener("connected", () => {
        console.log("뷰어 SSE 연결 성공");
      });

      eventSource.onerror = (error) => {
        console.warn("뷰어 SSE 연결 오류:", error);
        eventSource?.close();

        console.log("3초 후 재연결 시도...");
        reconnectTimeout = window.setTimeout(connect, 3000); // ⭐ window.setTimeout으로 명시
      };
    };


    connect();

    return () => {
      if (reconnectTimeout !== null) {
        clearTimeout(reconnectTimeout);
      }
      eventSource?.close();
    };
  }, [viewerLinkKey, isViewMode, updateTablePosition, replaceTables]);
};

export default useViewerStream;