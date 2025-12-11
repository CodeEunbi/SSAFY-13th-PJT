package backend.SSAFY_PTJ2.domain.textfilter.dto;

import lombok.*;
import lombok.extern.jackson.Jacksonized;

import java.util.List;
import java.util.Map;

/**
 * 텍스트 AI 컨테이너 응답 DTO - 개발자 B 담당
 *
 * 새로운 명세에 맞는 AI 컨테이너(/filter_page) 응답 구조:
 * {
 *   "pageUrl": "https://example.com",
 *   "filteredElements": [...],
 *   "processingTime": 0.897,
 *   "totalTexts": 16
 * }
 */
@Getter
@Builder
@Jacksonized
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@ToString
public class TextAIResponse {

    private String pageUrl;  // 처리한 페이지 URL
    private List<FilteredElement> filteredElements;  // 필터링된 요소들
    private double processingTime;  // AI 처리 시간 (초)
    private int totalTexts;  // 처리한 총 텍스트 수

    /**
     * 성공 여부 판별 (filteredElements가 null이 아니면 성공)
     */
    public boolean isSuccess() {
        return filteredElements != null;
    }

    /**
     * 필터링된 텍스트 요소
     */
    @Getter
    @Builder
    @Jacksonized
    @AllArgsConstructor
    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    @ToString
    public static class FilteredElement {

        private String elementId;  // 요소 식별자
        private List<FilteredText> filteredTexts;  // 해당 요소에서 필터링된 텍스트들
    }

    /**
     * 필터링된 텍스트 정보
     */
    @Getter
    @Builder
    @Jacksonized
    @AllArgsConstructor
    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    @ToString
    public static class FilteredText {

        private String text;  // 필터링된 텍스트 내용
        private int sIdx;  // 시작 인덱스
        private int eIdx;  // 종료 인덱스
        private List<String> detectedLabels;  // 감지된 혐오 카테고리 목록

        /**
         * 각 혐오 카테고리별 신뢰도
         * key: 카테고리 코드 (IN, VI, PO, AD, SE, CLEAN)
         * value: 신뢰도 (0.0 ~ 1.0)
         */
        private Map<String, Double> confidence;
    }
}