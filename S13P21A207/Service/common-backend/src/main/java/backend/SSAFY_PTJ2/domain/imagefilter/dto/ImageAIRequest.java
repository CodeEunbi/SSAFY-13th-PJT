package backend.SSAFY_PTJ2.domain.imagefilter.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

import java.util.List;
import java.util.Set;

/**
 * 이미지 AI 컨테이너 요청 DTO - 개발자 B 담당
 *
 * 외부 이미지 AI 컨테이너(/predict/batch)와의 HTTP 통신에 사용되는 요청 DTO입니다.
 * Form-data 형태로 다중 이미지를 배치 전송합니다.
 */
@Getter
@Builder
public class ImageAIRequest {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/avif", "image/bmp", "image/tiff", "image/x-icon"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final List<ImageFile> imageFiles;  // 배치 이미지 데이터 목록

    public void validateImageFiles() {
        if (imageFiles == null || imageFiles.isEmpty()) {
            throw new IllegalArgumentException("Image files cannot be null or empty");
        }

        for (ImageFile file : imageFiles) {
            validateImageFile(file);
        }
    }

    private void validateImageFile(ImageFile file) {
        if (file == null) {
            throw new IllegalArgumentException("Image file cannot be null");
        }

        if (file.getMimeType() == null || !ALLOWED_MIME_TYPES.contains(file.getMimeType().toLowerCase())) {
            throw new IllegalArgumentException("Unsupported image type: " + file.getMimeType() +
                    ". Allowed types: " + ALLOWED_MIME_TYPES);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File too large: " + file.getSize() +
                    " bytes. Maximum allowed: " + MAX_FILE_SIZE + " bytes");
        }

        if (file.getImageData() == null || file.getImageData().length == 0) {
            throw new IllegalArgumentException("Image data cannot be null or empty");
        }
    }

//    @JsonIgnore
//    private Options options;

    /**
     * 이미지 파일 정보
     */
    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static class ImageFile {

        private String id;
        private String filename;

        @JsonIgnore  // 멀티파트로만 전송, JSON 바인딩 제외
        private byte[] imageData;

        private String mimeType;  // "image/jpeg", "image/png"
        private long size;   // 파일 크키(bytes)
    }

    /**
     * 내부 유지용 옵션(멀티파트 파트로 변환됨)
     */
    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static class Options {
        private Integer imgSize;
        private Double threshold;
    }
}