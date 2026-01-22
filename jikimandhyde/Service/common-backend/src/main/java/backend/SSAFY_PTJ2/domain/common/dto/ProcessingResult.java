package backend.SSAFY_PTJ2.domain.common.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * AI 분석 처리 결과 DTO
 * 처리 완료 후 클라이언트에게 전송할 최종 데이터 구조
 */
@Getter
@Builder
public class ProcessingResult {

    /**
     * 원본 요청 ID (요청-응답 매칭용) 
     */
    private final String requestId;

    /**
     * 처리 성공 여부
     */
    private final boolean success;

    /**
     * 처리 완료 시간
     */
    private final LocalDateTime completedAt;

    /**
     * AI 분석 결과 데이터
     * - 텍스트: 혐오 표현 감지 결과 및 범위
     * - 이미지: 혐오 이미지 감지 여부 및 카테고리
     */
    private final AnalysisResult analysisResult;

    /**
     * 사용자 개인 설정이 적용된 후처리 결과
     */
    private final Map<String, Object> postProcessedData;

    /**
     * 에러 정보 (실패 시에만 존재)
     */
    private final ErrorInfo errorInfo;

    /**
     * 처리 소요 시간 (밀리초)
     */
    private final long processingTimeMs;

    /**
     * 캐시에서 조회된 결과인지 여부
     */
    private final boolean fromCache;

    /**
     * 에러 정보 클래스
     */
    @Getter
    @Builder
    public static class ErrorInfo {
        private final String errorCode;
        private final String errorMessage;
        private final String category;
    }
}