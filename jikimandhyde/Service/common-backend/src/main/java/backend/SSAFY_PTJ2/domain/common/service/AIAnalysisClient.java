package backend.SSAFY_PTJ2.domain.common.service;

import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;

/**
 * AI 분석 클라이언트 인터페이스 - 개발자 B 담당
 *
 * 외부 AI 컨테이너와의 HTTP 통신을 담당합니다.
 * 이미지와 텍스트 분석을 위한 각각의 구현체가 필요합니다.
 *
 * 배치 처리 지원:
 * - ImageProcessingRequest: 다중 이미지 배치 분석
 * - TextProcessingRequest: 다중 텍스트 배치 분석
 */
public interface AIAnalysisClient {

    /**
     * AI 분석 요청 처리 (배치 지원)
     * 동기적으로 AI 컨테이너에 HTTP 요청을 보내고 결과를 받아옵니다.
     *
     * 배치 처리 지원:
     * - ImageProcessingRequest: imageDataList의 모든 이미지를 배치로 처리
     * - TextProcessingRequest: textDataList의 모든 텍스트를 배치로 처리
     *
     * @param request 분석 요청 데이터 (단일 또는 배치)
     * @return AI 분석 결과 (배치인 경우 통합된 결과)
     * @throws AIAnalysisException 분석 처리 중 오류 발생 시
     */
    AnalysisResult analyze(ProcessingRequest request) throws AIAnalysisException;

    /**
     * AI 컨테이너 상태 확인
     * 헬스체크를 통해 컨테이너가 정상 동작하는지 확인합니다.
     *
     * @return 컨테이너 상태 (true: 정상, false: 비정상)
     */
    boolean isHealthy();

    /**
     * 지원하는 요청 타입 확인
     *
     * @param requestType 확인할 요청 타입
     * @return 지원 여부
     */
    boolean supportsRequestType(ProcessingRequest.RequestType requestType);

    /**
     * 클라이언트 정보 조회 (디버깅/모니터링용)
     *
     * @return 클라이언트 메타데이터
     */
    ClientInfo getClientInfo();

    /**
     * AI 분석 예외 클래스
     */
    class AIAnalysisException extends Exception {
        private final String errorCode;
        private final boolean isRetryable;

        public AIAnalysisException(String message, String errorCode, boolean isRetryable) {
            super(message);
            this.errorCode = errorCode;
            this.isRetryable = isRetryable;
        }

        public AIAnalysisException(String message, String errorCode, boolean isRetryable, Throwable cause) {
            super(message, cause);
            this.errorCode = errorCode;
            this.isRetryable = isRetryable;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public boolean isRetryable() {
            return isRetryable;
        }
    }

    /**
     * 클라이언트 정보 DTO
     */
    record ClientInfo(
        String clientType,        // 클라이언트 타입 (IMAGE/TEXT)
        String baseUrl,          // AI 컨테이너 기본 URL
        String version,          // AI 모델 버전
        int timeoutMs,           // 타임아웃 설정 (밀리초)
        boolean isAvailable      // 현재 사용 가능 여부
    ) {}
}