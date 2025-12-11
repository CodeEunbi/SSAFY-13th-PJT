package backend.SSAFY_PTJ2.domain.imagefilter.dto;

import lombok.*;
import lombok.extern.jackson.Jacksonized;

import java.util.List;

/**
 * 이미지 AI 컨테이너 응답 DTO - 개발자 B 담당
 *
 * 외부 이미지 AI 컨테이너(/predict/batch)로부터 받는 응답 DTO입니다.
 * 배치로 전송한 이미지들의 분석 결과를 포함합니다.
 */
@Getter
@Builder
@Jacksonized  // Jackson이 Builder를 사용해 역직렬화 가능
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class ImageAIResponse {

    private List<ImageAnalysisResult> results;  // 배치 이미지 분석 결과 목록
    private ImageCount imageCount;  // 이미지 분석 결과

    /**
     * 개별 이미지 분석 결과
     */
    @Getter
    @Builder
    @Jacksonized
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ImageAnalysisResult {

        private String id;
        private String filename;
        private String label;  // "crime", "gore", "normal", ...
        private double prob;
    }

    /**
     * 이미지 처리 통계
     */
    @Getter
    @Builder
    @Jacksonized
    @AllArgsConstructor
    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static class ImageCount {

        private int processedImages;
        private int skippedImages;  // 처리 실패한 이미지
    }
}