package backend.SSAFY_PTJ2.adapter.api.dto;

import backend.SSAFY_PTJ2.domain.common.dto.ProcessingResult;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * 이미지 분석 Socket.IO 응답 DTO
 * 클라이언트에게 전송되는 이미지 분석 결과
 */
@Getter
@Builder
public class ImageAnalysisSocketResponse {

    /**
     * 배치 이미지 총 처리 시간 (ms)
     */
    private final long processingTime;

    /**
     * 처리된 시각 (ISO 8601 형식)
     */
    private final String processedAt;

    /**
     * 이미지별 분석 결과 목록
     */
    private final List<ImageResultItem> results;

    /**
     * ProcessingResult에서 이미 후처리된 데이터를 ImageAnalysisSocketResponse로 변환
     * 사용자 설정 적용 등의 복잡한 로직은 PostProcessingUseCase에서 이미 처리된 상태
     */
    @SuppressWarnings("unchecked")
    public static ImageAnalysisSocketResponse fromProcessingResult(ProcessingResult processingResult) {
        if (processingResult == null || !processingResult.isSuccess()) {
            return ImageAnalysisSocketResponse.builder()
                .processingTime(0L)
                .processedAt(java.time.Instant.now().toString())
                .results(List.of())
                .build();
        }

        // PostProcessingUseCase에서 이미 변환된 postProcessedData 사용
        Map<String, Object> postProcessedData = processingResult.getPostProcessedData();
        if (postProcessedData != null) {
            Long processingTime = (Long) postProcessedData.get("processingTime");
            String processedAt = (String) postProcessedData.get("processedAt");
            List<Map<String, Object>> resultsData = (List<Map<String, Object>>) postProcessedData.get("results");

            List<ImageResultItem> results = resultsData != null ?
                resultsData.stream()
                    .map(ImageAnalysisSocketResponse::mapToImageResultItem)
                    .toList() : List.of();

            return ImageAnalysisSocketResponse.builder()
                .processingTime(processingTime != null ? processingTime : processingResult.getProcessingTimeMs())
                .processedAt(processedAt != null ? processedAt :
                    (processingResult.getCompletedAt() != null ?
                        processingResult.getCompletedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "Z" :
                        java.time.Instant.now().toString()))
                .results(results)
                .build();
        }

        // postProcessedData가 없는 경우 기본값으로 처리
        return ImageAnalysisSocketResponse.builder()
            .processingTime(processingResult.getProcessingTimeMs())
            .processedAt(processingResult.getCompletedAt() != null ?
                processingResult.getCompletedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "Z" :
                java.time.Instant.now().toString())
            .results(List.of())
            .build();
    }

    /**
     * Map 데이터를 ImageResultItem으로 변환하는 헬퍼 메서드
     */
    private static ImageResultItem mapToImageResultItem(Map<String, Object> resultData) {
        return ImageResultItem.builder()
            .elementId((String) resultData.get("elementId"))
            .shouldBlur((Boolean) resultData.get("shouldBlur"))
            .confidence(((Number) resultData.get("confidence")).doubleValue())
            .primaryCategory((String) resultData.get("primaryCategory"))
            .build();
    }

    /**
     * 개별 이미지 분석 결과
     */
    @Getter
    @Builder
    public static class ImageResultItem {

        /**
         * 이미지 요소 ID
         */
        private final String elementId;

        /**
         * 사용자 설정에 따라 해당 이미지를 블러해야할지 여부
         */
        private final boolean shouldBlur;

        /**
         * AI 분석 신뢰도 점수 (0.0 ~ 1.0)
         */
        private final double confidence;

        /**
         * 주요 카테고리 (shouldBlur가 true일 때만 값 존재, false면 null)
         */
        private final String primaryCategory;
    }
}