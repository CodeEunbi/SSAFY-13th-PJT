package backend.SSAFY_PTJ2.domain.common.service;

import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingResult;

import java.util.concurrent.CompletableFuture;

/**
 * 처리 스케줄러 인터페이스 - 개발자 C 담당
 *
 * 우선순위 큐를 이용한 AI 분석 요청 스케줄링을 담당합니다.
 * 뷰포트 컨텐츠를 우선적으로 처리하고, AI 컨테이너별 락을 관리합니다.
 */
public interface ProcessingScheduler {

    /**
     * 처리 요청 스케줄링 및 실행
     * 우선순위에 따라 큐에 추가하고, 적절한 AI 클라이언트로 처리합니다.
     *
     * @param request 처리 요청
     * @return 처리 결과 (동기적으로 반환)
     * @throws ProcessingException 처리 중 오류 발생 시
     */
    ProcessingResult scheduleAndProcess(ProcessingRequest request) throws ProcessingException;

    /**
     * 비동기 처리 요청 스케줄링
     * 향후 확장성을 위한 비동기 처리 인터페이스
     *
     * @param request 처리 요청
     * @return 처리 결과의 CompletableFuture
     */
    CompletableFuture<ProcessingResult> scheduleAndProcessAsync(ProcessingRequest request);

    /**
     * 현재 큐 상태 조회
     *
     * @return 큐 상태 정보
     */
    QueueStatus getQueueStatus();

    /**
     * 특정 요청 취소
     *
     * @param requestId 취소할 요청 ID
     * @return 취소 성공 여부
     */
    boolean cancelRequest(String requestId);

    /**
     * 스케줄러 상태 확인
     *
     * @return 스케줄러 상태 (정상/비정상)
     */
    boolean isHealthy();

    /**
     * 처리 예외 클래스
     */
    class ProcessingException extends Exception {
        private final String errorCode;
        private final ProcessingRequest.RequestType requestType;

        public ProcessingException(String message, String errorCode, ProcessingRequest.RequestType requestType) {
            super(message);
            this.errorCode = errorCode;
            this.requestType = requestType;
        }

        public ProcessingException(String message, String errorCode, ProcessingRequest.RequestType requestType, Throwable cause) {
            super(message, cause);
            this.errorCode = errorCode;
            this.requestType = requestType;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public ProcessingRequest.RequestType getRequestType() {
            return requestType;
        }
    }

    /**
     * 큐 상태 정보 DTO
     */
    record QueueStatus(
        int totalQueueSize,           // 전체 큐 크기
        int viewportQueueSize,        // 뷰포트 우선순위 큐 크기
        int normalQueueSize,          // 일반 우선순위 큐 크기
        boolean imageClientLocked,    // 이미지 AI 클라이언트 락 상태
        boolean textClientLocked,     // 텍스트 AI 클라이언트 락 상태
        long averageProcessingTimeMs  // 평균 처리 시간
    ) {}
}