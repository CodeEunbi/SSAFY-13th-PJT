package backend.SSAFY_PTJ2.adapter.api.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * Socket.IO image-analysis 이벤트에서 받는 이미지 메타데이터 DTO
 */
@Data
public class ImageAnalysisSocketRequest {

    /**
     * 이미지 element ID
     */
    private String elementId;

    /**
     * 이미지 MIME 타입 (image/jpeg, image/png 등)
     */
    private String mimeType;

    /**
     * 이미지 파일 크기 (바이트)
     */
    private Long size;

    /**
     * 이미지가 포함된 페이지 URL
     */
    private String pageUrl;

    /**
     * 이미지 메타데이터 (width, height, alt, src 등)
     */
    private Map<String, Object> imageMetadata;

    /**
     * 이미지 바이너리 데이터
     */
    private byte[] imageData;

}