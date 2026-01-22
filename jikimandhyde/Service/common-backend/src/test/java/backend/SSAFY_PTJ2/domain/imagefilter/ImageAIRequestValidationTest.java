package backend.SSAFY_PTJ2.domain.imagefilter;

import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageAIRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * ImageAIRequest 검증 로직 테스트
 * 개발자 B 담당: Content-Type, 파일 크기, 데이터 검증 테스트
 */
class ImageAIRequestValidationTest {

    @Test
    void validateImageFiles_정상_파일_검증_성공() {
        // Given
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        createValidImageFile("test.jpg", "image/jpeg", 1024L),
                        createValidImageFile("test.png", "image/png", 2048L),
                        createValidImageFile("test.webp", "image/webp", 512L)
                ))
                .build();

        // When & Then
        assertThatCode(() -> request.validateImageFiles())
                .doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    })
    void validateImageFiles_허용된_MIME_타입_검증_성공(String mimeType) {
        // Given
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        createValidImageFile("test.jpg", mimeType, 1024L)
                ))
                .build();

        // When & Then
        assertThatCode(() -> request.validateImageFiles())
                .doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "text/plain",
            "application/pdf",
            "video/mp4",
            "audio/mp3",
            "image/gif",  // GIF는 허용하지 않음
            "image/svg+xml"
    })
    void validateImageFiles_허용되지_않은_MIME_타입_검증_실패(String invalidMimeType) {
        // Given
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        createValidImageFile("test.file", invalidMimeType, 1024L)
                ))
                .build();

        // When & Then
        assertThatThrownBy(() -> request.validateImageFiles())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported image type")
                .hasMessageContaining(invalidMimeType);
    }

    @Test
    void validateImageFiles_대소문자_구분_없이_MIME_타입_검증() {
        // Given
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        createValidImageFile("test.jpg", "IMAGE/JPEG", 1024L),  // 대문자
                        createValidImageFile("test.png", "Image/Png", 2048L)    // 혼합
                ))
                .build();

        // When & Then
        assertThatCode(() -> request.validateImageFiles())
                .doesNotThrowAnyException();
    }

    @Test
    void validateImageFiles_최대_파일_크기_초과_검증_실패() {
        // Given - 10MB 초과 파일
        long oversizeFile = 11 * 1024 * 1024; // 11MB
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        createValidImageFile("large.jpg", "image/jpeg", oversizeFile)
                ))
                .build();

        // When & Then
        assertThatThrownBy(() -> request.validateImageFiles())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("File too large")
                .hasMessageContaining(String.valueOf(oversizeFile));
    }

    @Test
    void validateImageFiles_경계값_파일_크기_검증() {
        // Given - 정확히 10MB 파일
        long maxAllowedSize = 10 * 1024 * 1024; // 10MB
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        createValidImageFile("max.jpg", "image/jpeg", maxAllowedSize)
                ))
                .build();

        // When & Then
        assertThatCode(() -> request.validateImageFiles())
                .doesNotThrowAnyException();
    }

    @Test
    void validateImageFiles_빈_이미지_데이터_검증_실패() {
        // Given
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        ImageAIRequest.ImageFile.builder()
                                .id("img1")
                                .filename("empty.jpg")
                                .imageData(new byte[0])  // 빈 데이터
                                .mimeType("image/jpeg")
                                .size(0L)
                                .build()
                ))
                .build();

        // When & Then
        assertThatThrownBy(() -> request.validateImageFiles())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Image data cannot be null or empty");
    }

    @Test
    void validateImageFiles_null_이미지_데이터_검증_실패() {
        // Given
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        ImageAIRequest.ImageFile.builder()
                                .id("img1")
                                .filename("null.jpg")
                                .imageData(null)  // null 데이터
                                .mimeType("image/jpeg")
                                .size(1024L)
                                .build()
                ))
                .build();

        // When & Then
        assertThatThrownBy(() -> request.validateImageFiles())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Image data cannot be null or empty");
    }

    @Test
    void validateImageFiles_null_MIME_타입_검증_실패() {
        // Given
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        ImageAIRequest.ImageFile.builder()
                                .id("img1")
                                .filename("test.jpg")
                                .imageData("test data".getBytes())
                                .mimeType(null)  // null MIME 타입
                                .size(1024L)
                                .build()
                ))
                .build();

        // When & Then
        assertThatThrownBy(() -> request.validateImageFiles())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported image type: null");
    }

    @Test
    void validateImageFiles_null_파일_검증_실패() {
        // Given
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(Arrays.asList((ImageAIRequest.ImageFile) null))
                .build();

        // When & Then
        assertThatThrownBy(() -> request.validateImageFiles())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Image file cannot be null");
    }

    @Test
    void validateImageFiles_빈_파일_리스트_검증_실패() {
        // Given
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of())  // 빈 리스트
                .build();

        // When & Then
        assertThatThrownBy(() -> request.validateImageFiles())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Image files cannot be null or empty");
    }

    @Test
    void validateImageFiles_null_파일_리스트_검증_실패() {
        // Given
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(null)  // null 리스트
                .build();

        // When & Then
        assertThatThrownBy(() -> request.validateImageFiles())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Image files cannot be null or empty");
    }

    @Test
    void validateImageFiles_다중_파일_중_일부_실패_검증() {
        // Given - 두 번째 파일이 잘못된 타입
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        createValidImageFile("good.jpg", "image/jpeg", 1024L),
                        createValidImageFile("bad.txt", "text/plain", 512L)  // 잘못된 타입
                ))
                .build();

        // When & Then
        assertThatThrownBy(() -> request.validateImageFiles())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported image type: text/plain");
    }

    @Test
    void validateImageFiles_최소_크기_파일_검증_성공() {
        // Given - 1바이트 파일
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        createValidImageFile("tiny.jpg", "image/jpeg", 1L)
                ))
                .build();

        // When & Then
        assertThatCode(() -> request.validateImageFiles())
                .doesNotThrowAnyException();
    }

    @Test
    void validateImageFiles_대용량_파일_경계값_테스트() {
        // Given - 9.99MB 파일 (허용)
        long almostMaxSize = (long) (9.99 * 1024 * 1024);
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        createValidImageFile("almost-max.jpg", "image/jpeg", almostMaxSize)
                ))
                .build();

        // When & Then
        assertThatCode(() -> request.validateImageFiles())
                .doesNotThrowAnyException();
    }

    @Test
    void validateImageFiles_MIME_타입_허용_목록_확인() {
        // Given - 모든 허용된 타입
        ImageAIRequest request = ImageAIRequest.builder()
                .imageFiles(List.of(
                        createValidImageFile("test1.jpg", "image/jpeg", 1024L),
                        createValidImageFile("test2.jpg", "image/jpg", 1024L),
                        createValidImageFile("test3.png", "image/png", 1024L),
                        createValidImageFile("test4.webp", "image/webp", 1024L)
                ))
                .build();

        // When & Then
        assertThatCode(() -> request.validateImageFiles())
                .doesNotThrowAnyException();
    }

    private ImageAIRequest.ImageFile createValidImageFile(String filename, String mimeType, long size) {
        return ImageAIRequest.ImageFile.builder()
                .id("img-" + filename)
                .filename(filename)
                .imageData("test image data".getBytes())
                .mimeType(mimeType)
                .size(size)
                .build();
    }
}