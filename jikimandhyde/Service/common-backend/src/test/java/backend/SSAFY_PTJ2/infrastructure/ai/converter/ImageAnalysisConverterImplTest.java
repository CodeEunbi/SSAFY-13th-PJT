package backend.SSAFY_PTJ2.infrastructure.ai.converter;

import backend.SSAFY_PTJ2.domain.imagefilter.ImageLabels;
import backend.SSAFY_PTJ2.domain.imagefilter.converter.ImageAnalysisConverter;
import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageAIResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * ImageAnalysisConverter 구현체 테스트
 * 개발자 B 담당: 카테고리 매핑, 변환 로직 테스트
 */
class ImageAnalysisConverterImplTest {

    private ImageAnalysisConverterImpl converter;

    @BeforeEach
    void setUp() {
        converter = new ImageAnalysisConverterImpl();
    }

    @Test
    void convert_정상_응답_변환_성공() {
        // Given
        ImageAIResponse response = ImageAIResponse.builder()
                .results(List.of(
                        ImageAIResponse.ImageAnalysisResult.builder()
                                .id("img1")
                                .filename("test1.jpg")
                                .label("clean")
                                .prob(0.95)
                                .build(),
                        ImageAIResponse.ImageAnalysisResult.builder()
                                .id("img2")
                                .filename("test2.jpg")
                                .label("crime")
                                .prob(0.87)
                                .build()
                ))
                .imageCount(ImageAIResponse.ImageCount.builder()
                        .processedImages(2)
                        .skippedImages(0)
                        .build())
                .build();

        // When
        List<ImageAnalysisConverter.ImageResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(2);

        ImageAnalysisConverter.ImageResult result1 = results.get(0);
        assertThat(result1.id()).isEqualTo("img1");
        assertThat(result1.filename()).isEqualTo("test1.jpg");
        assertThat(result1.label()).isEqualTo(ImageLabels.CLEAN);
        assertThat(result1.prob()).isEqualTo(0.95);

        ImageAnalysisConverter.ImageResult result2 = results.get(1);
        assertThat(result2.id()).isEqualTo("img2");
        assertThat(result2.filename()).isEqualTo("test2.jpg");
        assertThat(result2.label()).isEqualTo(ImageLabels.CRIME);
        assertThat(result2.prob()).isEqualTo(0.87);
    }

    @ParameterizedTest
    @CsvSource({
            "CR, CRIME",
            "CRIME, CRIME",
            "AC, ACCIDENT",
            "ACCIDENT, ACCIDENT",
            "DI, ACCIDENT",
            "DISASTER, ACCIDENT",
            "HO, HORROR",
            "HORROR, HORROR",
            "GO, GORE",
            "GORE, GORE",
            "SE, SEXUAL",
            "SEXUAL, SEXUAL",
            "CLEAN, CLEAN",
            "NORMAL, CLEAN"
    })
    void convert_카테고리_매핑_테스트(String rawLabel, String expectedLabel) {
        // Given
        ImageAIResponse response = ImageAIResponse.builder()
                .results(List.of(
                        ImageAIResponse.ImageAnalysisResult.builder()
                                .id("img1")
                                .filename("test.jpg")
                                .label(rawLabel)
                                .prob(0.8)
                                .build()
                ))
                .build();

        // When
        List<ImageAnalysisConverter.ImageResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).label()).isEqualTo(ImageLabels.valueOf(expectedLabel));
    }

    @Test
    void convert_대소문자_구분_없이_매핑() {
        // Given
        ImageAIResponse response = ImageAIResponse.builder()
                .results(List.of(
                        ImageAIResponse.ImageAnalysisResult.builder()
                                .id("img1")
                                .filename("test1.jpg")
                                .label("crime")  // 소문자
                                .prob(0.8)
                                .build(),
                        ImageAIResponse.ImageAnalysisResult.builder()
                                .id("img2")
                                .filename("test2.jpg")
                                .label("GORE")   // 대문자
                                .prob(0.9)
                                .build(),
                        ImageAIResponse.ImageAnalysisResult.builder()
                                .id("img3")
                                .filename("test3.jpg")
                                .label("Sexual") // 혼합
                                .prob(0.7)
                                .build()
                ))
                .build();

        // When
        List<ImageAnalysisConverter.ImageResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(3);
        assertThat(results.get(0).label()).isEqualTo(ImageLabels.CRIME);
        assertThat(results.get(1).label()).isEqualTo(ImageLabels.GORE);
        assertThat(results.get(2).label()).isEqualTo(ImageLabels.SEXUAL);
    }

    @Test
    void convert_알려지지_않은_라벨_CLEAN_처리() {
        // Given
        ImageAIResponse response = ImageAIResponse.builder()
                .results(List.of(
                        ImageAIResponse.ImageAnalysisResult.builder()
                                .id("img1")
                                .filename("test.jpg")
                                .label("unknown_category")  // 알려지지 않은 카테고리
                                .prob(0.8)
                                .build(),
                        ImageAIResponse.ImageAnalysisResult.builder()
                                .id("img2")
                                .filename("test2.jpg")
                                .label("")  // 빈 문자열
                                .prob(0.9)
                                .build()
                ))
                .build();

        // When
        List<ImageAnalysisConverter.ImageResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(2);
        assertThat(results.get(0).label()).isEqualTo(ImageLabels.CLEAN);
        assertThat(results.get(1).label()).isEqualTo(ImageLabels.CLEAN);
    }

    @Test
    void convert_null_라벨_CLEAN_처리() {
        // Given
        ImageAIResponse response = ImageAIResponse.builder()
                .results(List.of(
                        ImageAIResponse.ImageAnalysisResult.builder()
                                .id("img1")
                                .filename("test.jpg")
                                .label(null)  // null 라벨
                                .prob(0.8)
                                .build()
                ))
                .build();

        // When
        List<ImageAnalysisConverter.ImageResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).label()).isEqualTo(ImageLabels.CLEAN);
    }

    @Test
    void convert_공백_포함_라벨_처리() {
        // Given
        ImageAIResponse response = ImageAIResponse.builder()
                .results(List.of(
                        ImageAIResponse.ImageAnalysisResult.builder()
                                .id("img1")
                                .filename("test.jpg")
                                .label("  CRIME  ")  // 앞뒤 공백
                                .prob(0.8)
                                .build()
                ))
                .build();

        // When
        List<ImageAnalysisConverter.ImageResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).label()).isEqualTo(ImageLabels.CRIME);
    }

    @Test
    void convert_null_응답_빈_리스트_반환() {
        // When
        List<ImageAnalysisConverter.ImageResult> results = converter.convert(null);

        // Then
        assertThat(results).isEmpty();
    }

    @Test
    void convert_null_결과_빈_리스트_반환() {
        // Given
        ImageAIResponse response = ImageAIResponse.builder()
                .results(null)
                .build();

        // When
        List<ImageAnalysisConverter.ImageResult> results = converter.convert(response);

        // Then
        assertThat(results).isEmpty();
    }

    @Test
    void convert_빈_결과_빈_리스트_반환() {
        // Given
        ImageAIResponse response = ImageAIResponse.builder()
                .results(List.of())
                .build();

        // When
        List<ImageAnalysisConverter.ImageResult> results = converter.convert(response);

        // Then
        assertThat(results).isEmpty();
    }

    @Test
    void convert_대용량_결과_처리() {
        // Given - 100개 결과
        List<ImageAIResponse.ImageAnalysisResult> largeResults = List.of();
        ImageAIResponse.ImageAnalysisResult[] results = new ImageAIResponse.ImageAnalysisResult[100];
        for (int i = 0; i < 100; i++) {
            results[i] = ImageAIResponse.ImageAnalysisResult.builder()
                    .id("img" + i)
                    .filename("test" + i + ".jpg")
                    .label(i % 2 == 0 ? "clean" : "crime")
                    .prob(0.8 + (i % 20) * 0.01)
                    .build();
        }

        ImageAIResponse response = ImageAIResponse.builder()
                .results(List.of(results))
                .build();

        // When
        List<ImageAnalysisConverter.ImageResult> convertedResults = converter.convert(response);

        // Then
        assertThat(convertedResults).hasSize(100);
        assertThat(convertedResults.get(0).label()).isEqualTo(ImageLabels.CLEAN);
        assertThat(convertedResults.get(1).label()).isEqualTo(ImageLabels.CRIME);
        assertThat(convertedResults.get(50).label()).isEqualTo(ImageLabels.CLEAN);
        assertThat(convertedResults.get(99).label()).isEqualTo(ImageLabels.CRIME);
    }

    @Test
    void convert_확률_값_유지_테스트() {
        // Given
        ImageAIResponse response = ImageAIResponse.builder()
                .results(List.of(
                        ImageAIResponse.ImageAnalysisResult.builder()
                                .id("img1")
                                .filename("test.jpg")
                                .label("crime")
                                .prob(0.123456789)  // 정밀한 확률 값
                                .build()
                ))
                .build();

        // When
        List<ImageAnalysisConverter.ImageResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).prob()).isEqualTo(0.123456789);
    }

    @Test
    void convert_모든_카테고리_매핑_완전성_테스트() {
        // Given - 모든 가능한 카테고리
        ImageAIResponse response = ImageAIResponse.builder()
                .results(List.of(
                        createResult("1", "CR"),
                        createResult("2", "CRIME"),
                        createResult("3", "AC"),
                        createResult("4", "ACCIDENT"),
                        createResult("5", "DI"),
                        createResult("6", "DISASTER"),
                        createResult("7", "HO"),
                        createResult("8", "HORROR"),
                        createResult("9", "GO"),
                        createResult("10", "GORE"),
                        createResult("11", "SE"),
                        createResult("12", "SEXUAL"),
                        createResult("13", "CLEAN"),
                        createResult("14", "NORMAL")
                ))
                .build();

        // When
        List<ImageAnalysisConverter.ImageResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(14);
        assertThat(results.get(0).label()).isEqualTo(ImageLabels.CRIME);
        assertThat(results.get(1).label()).isEqualTo(ImageLabels.CRIME);
        assertThat(results.get(2).label()).isEqualTo(ImageLabels.ACCIDENT);
        assertThat(results.get(3).label()).isEqualTo(ImageLabels.ACCIDENT);
        assertThat(results.get(4).label()).isEqualTo(ImageLabels.ACCIDENT);
        assertThat(results.get(5).label()).isEqualTo(ImageLabels.ACCIDENT);
        assertThat(results.get(6).label()).isEqualTo(ImageLabels.HORROR);
        assertThat(results.get(7).label()).isEqualTo(ImageLabels.HORROR);
        assertThat(results.get(8).label()).isEqualTo(ImageLabels.GORE);
        assertThat(results.get(9).label()).isEqualTo(ImageLabels.GORE);
        assertThat(results.get(10).label()).isEqualTo(ImageLabels.SEXUAL);
        assertThat(results.get(11).label()).isEqualTo(ImageLabels.SEXUAL);
        assertThat(results.get(12).label()).isEqualTo(ImageLabels.CLEAN);
        assertThat(results.get(13).label()).isEqualTo(ImageLabels.CLEAN);
    }

    private ImageAIResponse.ImageAnalysisResult createResult(String id, String label) {
        return ImageAIResponse.ImageAnalysisResult.builder()
                .id("img" + id)
                .filename("test" + id + ".jpg")
                .label(label)
                .prob(0.8)
                .build();
    }
}