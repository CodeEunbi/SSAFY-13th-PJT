package backend.SSAFY_PTJ2.domain.common.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.util.List;
import java.util.Map;

/**
 * AI 분석 결과 DTO
 * AI 컨테이너로부터 받은 배치 분석 결과를 담는 구조
 *
 * 배치 처리 지원:
 * - 이미지: 여러 이미지의 분석 결과를 imageResults에 저장
 * - 텍스트: 여러 텍스트 요소의 분석 결과를 textResults에 저장
 */
@Getter
@Builder
@ToString
public class AnalysisResult {

    private final boolean success;
    private final String analysisType;
    private final List<ImageAnalysisItem> imageResults;
    private final List<TextAnalysisItem> textResults;
    private final ProcessingStats processingStats;
    private final Map<String, Object> additionalData;

    /**
     * 개별 이미지 분석 결과
     */
    @Getter
    @Builder
    public static class ImageAnalysisItem {

        private final String imageId;
        private final boolean isHateful;
        private final double confidenceScore;
        private final List<String> detectedCategories;
        private final List<ImageRegion> hatefulRegions;
    }

    /**
     * 개별 텍스트 분석 결과
     */
    @Getter
    @Builder
    public static class TextAnalysisItem {

        private final String elementId;
        private final List<TextRange> hatefulRanges;
        private final int originalLength;
    }

    /**
     * 처리 통계
     */
    @Getter
    @Builder
    public static class ProcessingStats {

        private final int totalRequested;
        private final int successfullyProcessed;
        private final int failed;
        private final int hatefulCount;
        private final int processedImages;
        private final int skippedImages;
    }

    /**
     * 텍스트 내 혐오 표현 범위 정보
     */
    @Getter
    @Builder
    public static class TextRange {
        private final int startIndex;  // 시작 인덱스
        private final int endIndex;    // 종료 인덱스
        private final List<String> category; // 혐오 카테고리
        private final double score;    // 해당 범위의 신뢰도
    }

    /**
     * 이미지 내 혐오 요소 영역 정보
     */
    @Getter
    @Builder
    public static class ImageRegion {
        private final int x;           // X 좌표
        private final int y;           // Y 좌표
        private final int width;       // 너비
        private final int height;      // 높이
        private final String category; // 혐오 카테고리
        private final double score;    // 해당 영역의 신뢰도
    }
}