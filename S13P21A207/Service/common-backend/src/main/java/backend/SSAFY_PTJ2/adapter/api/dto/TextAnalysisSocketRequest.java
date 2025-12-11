package backend.SSAFY_PTJ2.adapter.api.dto;

import lombok.Data;

import java.util.Map;

/**
 * Socket.IO text-analysis 이벤트에서 받는 텍스트 메타데이터 DTO
 */
@Data
public class TextAnalysisSocketRequest {

    /**
     * 텍스트 element ID
     */
    private String elementId;

    /**
     * 분석할 텍스트 내용
     */
    private String content;

    /**
     * 텍스트가 포함된 페이지 URL
     */
    private String pageUrl;

    /**
     * 텍스트 엘리먼트 메타데이터 (태그명, 클래스, 뷰포트 여부 등)
     */
    private Map<String, Object> elementMetadata;

}