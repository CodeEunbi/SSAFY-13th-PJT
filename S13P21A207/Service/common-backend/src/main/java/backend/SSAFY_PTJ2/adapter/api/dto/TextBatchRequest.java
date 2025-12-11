package backend.SSAFY_PTJ2.adapter.api.dto;

import lombok.Data;

import java.util.List;

/**
 * 프론트엔드 TextBatchPayload와 호환되는 텍스트 배치 요청 DTO
 */
@Data
public class TextBatchRequest {

    /**
     * 페이지 URL
     */
    private String url;

    /**
     * 텍스트 배치 아이템 리스트
     */
    private List<TextBatchItem> items;

    /**
     * 언어 설정 (선택적)
     */
    private String lang;

    /**
     * 타임스탬프
     */
    private Long ts;

    /**
     * 요청 ID
     */
    private String reqId;

    /**
     * 키워드 리스트 (선택적)
     */
    private List<String> keywords;

    /**
     * 최대 길이 (선택적)
     */
    private Integer maxLen;

    /**
     * 텍스트 배치 아이템
     */
    @Data
    public static class TextBatchItem {
        /**
         * DOM 요소 식별자
         */
        private String elementId;

        /**
         * CSS 선택자
         */
        private String selector;

        /**
         * 텍스트 내용
         */
        private String text;
    }
}