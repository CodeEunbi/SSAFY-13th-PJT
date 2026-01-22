package backend.SSAFY_PTJ2.domain.common.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 텍스트 분석 처리 요청 DTO
 * Socket.io에서 받은 다중 텍스트 데이터를 타입 안전하게 배치 처리
 */
@Getter
public class TextProcessingRequest extends ProcessingRequest {

    /**
     * 배치 처리할 텍스트 데이터 리스트
     * Socket.io에서 받은 다중 텍스트를 한 번에 처리
     */
    private final List<TextData> textDataList;

    /**
     * 개별 텍스트 데이터 클래스
     */
    @Getter
    @Builder
    public static class TextData {
        /**
         * DOM 요소 ID
         */
        private final String elementId;

        /**
         * 분석할 텍스트 내용
         */
        private final String content;

        /**
         * 페이지 URL
         */
        private final String pageUrl;

        /**
         * 텍스트 메타정보 (tagName, className 등)
         */
        private final Map<String, Object> elementMetadata;

        /**
         * 텍스트 길이 검증
         */
        public boolean isValidLength() {
            return content != null && !content.trim().isEmpty() && content.length() <= 10000;
        }

        /**
         * 텍스트 내용이 비어있지 않은지 확인
         */
        public boolean hasContent() {
            return content != null && !content.trim().isEmpty();
        }

        /**
         * 텍스트 길이 (문자 수)
         */
        public int getContentLength() {
            return content != null ? content.length() : 0;
        }
    }

    @Builder
    public TextProcessingRequest(String requestId, Priority priority, LocalDateTime timestamp,
                               String sessionId, String elementId, String pageUrl,
                               List<TextData> textDataList) {
        super(requestId, RequestType.TEXT_ANALYSIS, priority, timestamp, sessionId, elementId, pageUrl);
        this.textDataList = textDataList;
    }

    /**
     * 배치 텍스트 개수
     */
    public int getTextCount() {
        return textDataList != null ? textDataList.size() : 0;
    }

    /**
     * 모든 텍스트가 유효한 길이인지 확인
     */
    public boolean areAllTextsValidLength() {
        return textDataList != null && textDataList.stream().allMatch(TextData::isValidLength);
    }

    /**
     * 모든 텍스트가 내용을 가지고 있는지 확인
     */
    public boolean doAllTextsHaveContent() {
        return textDataList != null && textDataList.stream().allMatch(TextData::hasContent);
    }

    /**
     * 총 텍스트 길이 (문자 수)
     */
    public int getTotalContentLength() {
        return textDataList != null ?
            textDataList.stream().mapToInt(TextData::getContentLength).sum() : 0;
    }

    /**
     * 배치가 비어있지 않은지 확인
     */
    public boolean hasTexts() {
        return textDataList != null && !textDataList.isEmpty();
    }
}