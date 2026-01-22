package backend.SSAFY_PTJ2.domain.common.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 이미지 분석 처리 요청 DTO
 * Socket.io에서 받은 다중 이미지 데이터를 타입 안전하게 배치 처리
 */
@Getter
public class ImageProcessingRequest extends ProcessingRequest {

    /**
     * 배치 처리할 이미지 데이터 리스트
     * Socket.io에서 받은 다중 이미지를 한 번에 처리
     */
    private final List<ImageData> imageDataList;

    /**
     * 개별 이미지 데이터 클래스
     */
    @Getter
    @Builder
    public static class ImageData {
        /**
         * 이미지 바이너리 데이터
         */
        private final byte[] data;

        /**
         * 이미지 MIME 타입
         */
        private final String mimeType;

        /**
         * form-data 전송시 사용할 파일명
         */
        private final String fileName;

        /**
         * 이미지 크기 (바이트)
         */
        private final long size;

        /**
         * DOM 요소 ID
         */
        private final String elementId;

        /**
         * 이미지 메타정보 (width, height, alt, src 등)
         */
        private final Map<String, Object> metadata;

        /**
         * 파일 확장자 추출
         */
        public String getFileExtension() {
            return switch (mimeType) {
                case "image/jpeg" -> ".jpg";
                case "image/png" -> ".png";
                case "image/gif" -> ".gif";
                case "image/webp" -> ".webp";
                case "image/avif" -> ".avif";
                case "image/bmp" -> ".bmp";
                case "image/tiff" -> ".tiff";
                case "image/x-icon" -> ".ico";
                default -> ".jpg";
            };
        }

        /**
         * 이미지 크기 검증 (1MB 이하)
         */
        public boolean isValidSize() {
            return size <= 1024 * 1024; // 1MB
        }

        /**
         * 지원하는 이미지 형식인지 확인
         */
        public boolean isSupportedFormat() {
            return mimeType != null && (
                mimeType.equals("image/jpeg") ||
                mimeType.equals("image/png") ||
                mimeType.equals("image/gif") ||
                mimeType.equals("image/webp") ||
                mimeType.equals("image/avif") ||
                mimeType.equals("image/bmp") ||
                mimeType.equals("image/tiff") ||
                mimeType.equals("image/x-icon")
            );
        }
    }

    @Builder
    public ImageProcessingRequest(String requestId, Priority priority, LocalDateTime timestamp,
                                String sessionId, String elementId, String pageUrl,
                                List<ImageData> imageDataList) {
        super(requestId, RequestType.IMAGE_ANALYSIS, priority, timestamp, sessionId, elementId, pageUrl);
        this.imageDataList = imageDataList;
    }

    /**
     * 배치 이미지 개수
     */
    public int getImageCount() {
        return imageDataList != null ? imageDataList.size() : 0;
    }

    /**
     * 모든 이미지가 유효한 크기인지 확인
     */
    public boolean areAllImagesValidSize() {
        return imageDataList != null && imageDataList.stream().allMatch(ImageData::isValidSize);
    }

    /**
     * 모든 이미지가 지원하는 형식인지 확인
     */
    public boolean areAllImagesSupported() {
        return imageDataList != null && imageDataList.stream().allMatch(ImageData::isSupportedFormat);
    }

    /**
     * 총 이미지 데이터 크기 (바이트)
     */
    public long getTotalSize() {
        return imageDataList != null ?
            imageDataList.stream().mapToLong(ImageData::getSize).sum() : 0;
    }

    /**
     * 배치가 비어있지 않은지 확인
     */
    public boolean hasImages() {
        return imageDataList != null && !imageDataList.isEmpty();
    }
}