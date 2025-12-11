package backend.SSAFY_PTJ2.adapter.api.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Socket.IO text-analysis 응답 DTO
 * 노션 명세에 따른 텍스트 AI 분석 완료 응답 구조
 */
@Data
@Builder
public class TextAnalysisSocketResponse {

    /**
     * 배치 텍스트 총 처리 시간 (밀리초)
     */
    private Long processingTime;

    /**
     * 처리된 시각
     */
    private String processedAt;

    /**
     * 텍스트별 분석 결과 리스트
     */
    private List<TextResult> results;

    /**
     * 개별 텍스트 분석 결과
     */
    @Data
    @Builder
    public static class TextResult {
        /**
         * 텍스트 element ID
         */
        private String elementId;

        /**
         * 필터링된 부분의 인덱스 범위들
         */
        private List<FilteredIndex> filteredIndexes;

        /**
         * 원본 텍스트 길이
         */
        private Integer originalLength;

        /**
         * 처리된 시각
         */
        private String processedAt;

        /**
         * 개별 텍스트 처리 시간 (밀리초)
         */
        private Long processingTime;
    }

    /**
     * 필터링된 텍스트 인덱스 범위
     */
    @Data
    @Builder
    public static class FilteredIndex {
        /**
         * 시작 인덱스
         */
        private int start;

        /**
         * 끝 인덱스
         */
        private int end;

        /**
         * 혐오 표현 유형
         * - IN: 인신공격
         * - PO: 정치
         * - AD: 광고
         * - SE: 성적
         * - VI: 폭력
         */
        private List<String> type;

        /**
         * AI 모델의 예측 신뢰도 (0.0-1.0)
         */
        private double confidence;
    }
}