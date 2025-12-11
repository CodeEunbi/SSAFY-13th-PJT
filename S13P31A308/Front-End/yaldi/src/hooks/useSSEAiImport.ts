import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useAiImportStore, type ValidationResponse } from "../stores/aiImportStore";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const useSSEAiImport = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const jobId = useAiImportStore((state) => state.jobId);
  const setValidationResult = useAiImportStore((state) => state.setValidationResult);
  const setLoading = useAiImportStore((state) => state.setLoading);

  useEffect(() => {
    // jobId가 없거나 로그인 안 되어 있으면 연결 안 함
    if (!jobId || !isLoggedIn) {
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectTimeout: number | null = null;

    const connect = () => {
      // 이전 재연결 타이머 제거
      if (reconnectTimeout !== null) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      console.log(`[SSE] Connecting to jobId: ${jobId}`);

      eventSource = new EventSource(`${BASE_URL}/api/v1/async-jobs/${jobId}/subscribe`, {
        withCredentials: true,
      });

      eventSource.addEventListener("connected", (event) => {
        console.log("[SSE] connected:", event.data);
      });

      eventSource.addEventListener("import-validation", (event) => {
        console.log("[SSE] import-validation 이벤트 도착:", event.data);

        try {
          const data: ValidationResponse = JSON.parse(event.data);

          // Store에 결과 저장
          setValidationResult(data);

          console.log("[SSE] ValidationResponse 저장 완료:", data);
        } catch (error) {
          console.error("[SSE] 응답 파싱 실패:", error);
          setLoading(false);
        }

        eventSource?.close();
      });

      eventSource.onerror = (error) => {
        console.warn("[SSE] 연결 오류:", error);
        eventSource?.close();

        // 로그인 상태일 때만 재연결 시도
        if (isLoggedIn && jobId) {
          console.log("[SSE] 3초 후 재연결 시도...");
          reconnectTimeout = window.setTimeout(connect, 3000);
        } else {
          setLoading(false);
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimeout !== null) {
        clearTimeout(reconnectTimeout);
      }
      eventSource?.close();
    };
  }, [jobId, isLoggedIn, setValidationResult, setLoading]);
};

export default useSSEAiImport;