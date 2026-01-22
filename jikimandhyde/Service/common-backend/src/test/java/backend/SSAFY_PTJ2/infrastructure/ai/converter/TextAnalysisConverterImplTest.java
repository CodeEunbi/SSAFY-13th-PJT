package backend.SSAFY_PTJ2.infrastructure.ai.converter;

import backend.SSAFY_PTJ2.domain.textfilter.TextLabels;
import backend.SSAFY_PTJ2.domain.textfilter.converter.TextAnalysisConverter;
import backend.SSAFY_PTJ2.domain.textfilter.dto.TextAIResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * TextAnalysisConverter 구현체 테스트
 * 개발자 B 담당: 텍스트 카테고리 매핑, 신뢰도 변환, 스팬 처리 테스트
 */
class TextAnalysisConverterImplTest {

    private TextAnalysisConverterImpl converter;

    @BeforeEach
    void setUp() {
        converter = new TextAnalysisConverterImpl();
    }

    @Test
    void convert_정상_응답_변환_성공() {
        // Given
        TextAIResponse response = TextAIResponse.builder()
                .isSuccess(true)
                .code("200")
                .message("Success")
                .result(TextAIResponse.TextAnalysisResult.builder()
                        .blurredTextsInfo(List.of(
                                TextAIResponse.BlurredTextInfo.builder()
                                        .elementId("text1")
                                        .filteredIndexes(List.of(
                                                TextAIResponse.FilteredIndex.builder()
                                                        .sIdx(10)
                                                        .eIdx(20)
                                                        .detectedLabels(List.of("INSULT"))
                                                        .confidence(Map.of(
                                                                "INSULT", 0.9,
                                                                "CLEAN", 0.1
                                                        ))
                                                        .build()
                                        ))
                                        .build()
                        ))
                        .build())
                .build();

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);

        TextAnalysisConverter.ElementSpanResult result = results.get(0);
        assertThat(result.elementId()).isEqualTo("text1");
        assertThat(result.spans()).hasSize(1);

        TextAnalysisConverter.ElementSpanResult.Span span = result.spans().get(0);
        assertThat(span.start()).isEqualTo(10);
        assertThat(span.end()).isEqualTo(20);
        assertThat(span.labels()).containsExactly(TextLabels.INSULT);
        assertThat(span.confidence()).containsEntry(TextLabels.INSULT, 0.9);
        assertThat(span.confidence()).containsEntry(TextLabels.CLEAN, 0.1);
    }

    @ParameterizedTest
    @CsvSource({
            "IN, INSULT",
            "INSULT, INSULT",
            "VI, VIOLENCE",
            "VIOLENCE, VIOLENCE",
            "SE, SEXUAL",
            "SEXUAL, SEXUAL",
            "AD, AD",
            "ADVERTISEMENT, AD",
            "PO, POLITICS",
            "POLITICS, POLITICS",
            "CLEAN, CLEAN",
            "NORMAL, CLEAN"
    })
    void convert_카테고리_매핑_테스트(String rawLabel, String expectedLabel) {
        // Given
        TextAIResponse response = createResponseWithSingleDetection("text1", rawLabel, 0.8);

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).spans()).hasSize(1);
        assertThat(results.get(0).spans().get(0).labels())
                .containsExactly(TextLabels.valueOf(expectedLabel));
    }

    @Test
    void convert_대소문자_구분_없이_매핑() {
        // Given
        TextAIResponse response = TextAIResponse.builder()
                .isSuccess(true)
                .result(TextAIResponse.TextAnalysisResult.builder()
                        .blurredTextsInfo(List.of(
                                TextAIResponse.BlurredTextInfo.builder()
                                        .elementId("text1")
                                        .filteredIndexes(List.of(
                                                createFilteredIndex(0, 10, List.of("insult")),      // 소문자
                                                createFilteredIndex(15, 25, List.of("VIOLENCE")),   // 대문자
                                                createFilteredIndex(30, 40, List.of("Sexual"))      // 혼합
                                        ))
                                        .build()
                        ))
                        .build())
                .build();

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).spans()).hasSize(3);
        assertThat(results.get(0).spans().get(0).labels()).containsExactly(TextLabels.INSULT);
        assertThat(results.get(0).spans().get(1).labels()).containsExactly(TextLabels.VIOLENCE);
        assertThat(results.get(0).spans().get(2).labels()).containsExactly(TextLabels.SEXUAL);
    }

    @Test
    void convert_알려지지_않은_라벨_CLEAN_처리() {
        // Given
        TextAIResponse response = createResponseWithSingleDetection("text1", "unknown_category", 0.8);

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).spans()).hasSize(1);
        assertThat(results.get(0).spans().get(0).labels()).containsExactly(TextLabels.CLEAN);
    }

    @Test
    void convert_다중_라벨_처리() {
        // Given
        TextAIResponse response = TextAIResponse.builder()
                .isSuccess(true)
                .result(TextAIResponse.TextAnalysisResult.builder()
                        .blurredTextsInfo(List.of(
                                TextAIResponse.BlurredTextInfo.builder()
                                        .elementId("text1")
                                        .filteredIndexes(List.of(
                                                TextAIResponse.FilteredIndex.builder()
                                                        .sIdx(10)
                                                        .eIdx(20)
                                                        .detectedLabels(List.of("INSULT", "VIOLENCE", "SEXUAL"))
                                                        .confidence(Map.of(
                                                                "INSULT", 0.7,
                                                                "VIOLENCE", 0.8,
                                                                "SEXUAL", 0.6
                                                        ))
                                                        .build()
                                        ))
                                        .build()
                        ))
                        .build())
                .build();

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).spans()).hasSize(1);

        TextAnalysisConverter.ElementSpanResult.Span span = results.get(0).spans().get(0);
        assertThat(span.labels()).containsExactlyInAnyOrder(
                TextLabels.INSULT, TextLabels.VIOLENCE, TextLabels.SEXUAL
        );
        assertThat(span.confidence()).containsEntry(TextLabels.INSULT, 0.7);
        assertThat(span.confidence()).containsEntry(TextLabels.VIOLENCE, 0.8);
        assertThat(span.confidence()).containsEntry(TextLabels.SEXUAL, 0.6);
    }

    @Test
    void convert_다중_요소_다중_스팬_처리() {
        // Given
        TextAIResponse response = TextAIResponse.builder()
                .isSuccess(true)
                .result(TextAIResponse.TextAnalysisResult.builder()
                        .blurredTextsInfo(List.of(
                                // 첫 번째 요소
                                TextAIResponse.BlurredTextInfo.builder()
                                        .elementId("text1")
                                        .filteredIndexes(List.of(
                                                createFilteredIndex(0, 10, List.of("INSULT")),
                                                createFilteredIndex(20, 30, List.of("VIOLENCE"))
                                        ))
                                        .build(),
                                // 두 번째 요소
                                TextAIResponse.BlurredTextInfo.builder()
                                        .elementId("text2")
                                        .filteredIndexes(List.of(
                                                createFilteredIndex(5, 15, List.of("SEXUAL"))
                                        ))
                                        .build()
                        ))
                        .build())
                .build();

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(2);

        // 첫 번째 요소 검증
        assertThat(results.get(0).elementId()).isEqualTo("text1");
        assertThat(results.get(0).spans()).hasSize(2);
        assertThat(results.get(0).spans().get(0).labels()).containsExactly(TextLabels.INSULT);
        assertThat(results.get(0).spans().get(1).labels()).containsExactly(TextLabels.VIOLENCE);

        // 두 번째 요소 검증
        assertThat(results.get(1).elementId()).isEqualTo("text2");
        assertThat(results.get(1).spans()).hasSize(1);
        assertThat(results.get(1).spans().get(0).labels()).containsExactly(TextLabels.SEXUAL);
    }

    @Test
    void convert_빈_스팬_요소_처리() {
        // Given
        TextAIResponse response = TextAIResponse.builder()
                .isSuccess(true)
                .result(TextAIResponse.TextAnalysisResult.builder()
                        .blurredTextsInfo(List.of(
                                TextAIResponse.BlurredTextInfo.builder()
                                        .elementId("text1")
                                        .filteredIndexes(List.of())  // 빈 필터링 인덱스
                                        .build(),
                                TextAIResponse.BlurredTextInfo.builder()
                                        .elementId("text2")
                                        .filteredIndexes(null)  // null 필터링 인덱스
                                        .build()
                        ))
                        .build())
                .build();

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(2);
        assertThat(results.get(0).elementId()).isEqualTo("text1");
        assertThat(results.get(0).spans()).isEmpty();
        assertThat(results.get(1).elementId()).isEqualTo("text2");
        assertThat(results.get(1).spans()).isEmpty();
    }

    @Test
    void convert_null_신뢰도_처리() {
        // Given
        TextAIResponse response = TextAIResponse.builder()
                .isSuccess(true)
                .result(TextAIResponse.TextAnalysisResult.builder()
                        .blurredTextsInfo(List.of(
                                TextAIResponse.BlurredTextInfo.builder()
                                        .elementId("text1")
                                        .filteredIndexes(List.of(
                                                TextAIResponse.FilteredIndex.builder()
                                                        .sIdx(10)
                                                        .eIdx(20)
                                                        .detectedLabels(List.of("INSULT"))
                                                        .confidence(null)  // null 신뢰도
                                                        .build()
                                        ))
                                        .build()
                        ))
                        .build())
                .build();

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).spans()).hasSize(1);
        assertThat(results.get(0).spans().get(0).confidence()).isEmpty();
    }

    @Test
    void convert_null_라벨_리스트_처리() {
        // Given
        TextAIResponse response = TextAIResponse.builder()
                .isSuccess(true)
                .result(TextAIResponse.TextAnalysisResult.builder()
                        .blurredTextsInfo(List.of(
                                TextAIResponse.BlurredTextInfo.builder()
                                        .elementId("text1")
                                        .filteredIndexes(List.of(
                                                TextAIResponse.FilteredIndex.builder()
                                                        .sIdx(10)
                                                        .eIdx(20)
                                                        .detectedLabels(null)  // null 라벨 리스트
                                                        .confidence(Map.of("CLEAN", 1.0))
                                                        .build()
                                        ))
                                        .build()
                        ))
                        .build())
                .build();

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).spans()).hasSize(1);
        assertThat(results.get(0).spans().get(0).labels()).isEmpty();
    }

    @Test
    void convert_null_응답_빈_리스트_반환() {
        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(null);

        // Then
        assertThat(results).isEmpty();
    }

    @Test
    void convert_null_결과_빈_리스트_반환() {
        // Given
        TextAIResponse response = TextAIResponse.builder()
                .isSuccess(true)
                .result(null)
                .build();

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).isEmpty();
    }

    @Test
    void convert_null_정보_리스트_빈_리스트_반환() {
        // Given
        TextAIResponse response = TextAIResponse.builder()
                .isSuccess(true)
                .result(TextAIResponse.TextAnalysisResult.builder()
                        .blurredTextsInfo(null)
                        .build())
                .build();

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).isEmpty();
    }

    @Test
    void convert_공백_포함_라벨_처리() {
        // Given
        TextAIResponse response = createResponseWithSingleDetection("text1", "  INSULT  ", 0.8);

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).spans()).hasSize(1);
        assertThat(results.get(0).spans().get(0).labels()).containsExactly(TextLabels.INSULT);
    }

    @Test
    void convert_모든_카테고리_매핑_완전성_테스트() {
        // Given
        TextAIResponse response = TextAIResponse.builder()
                .isSuccess(true)
                .result(TextAIResponse.TextAnalysisResult.builder()
                        .blurredTextsInfo(List.of(
                                TextAIResponse.BlurredTextInfo.builder()
                                        .elementId("text1")
                                        .filteredIndexes(List.of(
                                                createFilteredIndex(0, 10, List.of("IN")),
                                                createFilteredIndex(10, 20, List.of("INSULT")),
                                                createFilteredIndex(20, 30, List.of("VI")),
                                                createFilteredIndex(30, 40, List.of("VIOLENCE")),
                                                createFilteredIndex(40, 50, List.of("SE")),
                                                createFilteredIndex(50, 60, List.of("SEXUAL")),
                                                createFilteredIndex(60, 70, List.of("AD")),
                                                createFilteredIndex(70, 80, List.of("ADVERTISEMENT")),
                                                createFilteredIndex(80, 90, List.of("PO")),
                                                createFilteredIndex(90, 100, List.of("POLITICS")),
                                                createFilteredIndex(100, 110, List.of("CLEAN")),
                                                createFilteredIndex(110, 120, List.of("NORMAL"))
                                        ))
                                        .build()
                        ))
                        .build())
                .build();

        // When
        List<TextAnalysisConverter.ElementSpanResult> results = converter.convert(response);

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).spans()).hasSize(12);

        List<TextLabels> expectedLabels = List.of(
                TextLabels.INSULT, TextLabels.INSULT,
                TextLabels.VIOLENCE, TextLabels.VIOLENCE,
                TextLabels.SEXUAL, TextLabels.SEXUAL,
                TextLabels.AD, TextLabels.AD,
                TextLabels.POLITICS, TextLabels.POLITICS,
                TextLabels.CLEAN, TextLabels.CLEAN
        );

        for (int i = 0; i < 12; i++) {
            assertThat(results.get(0).spans().get(i).labels())
                    .containsExactly(expectedLabels.get(i));
        }
    }

    private TextAIResponse createResponseWithSingleDetection(String elementId, String label, double confidence) {
        return TextAIResponse.builder()
                .isSuccess(true)
                .result(TextAIResponse.TextAnalysisResult.builder()
                        .blurredTextsInfo(List.of(
                                TextAIResponse.BlurredTextInfo.builder()
                                        .elementId(elementId)
                                        .filteredIndexes(List.of(
                                                TextAIResponse.FilteredIndex.builder()
                                                        .sIdx(10)
                                                        .eIdx(20)
                                                        .detectedLabels(List.of(label))
                                                        .confidence(Map.of(label, confidence))
                                                        .build()
                                        ))
                                        .build()
                        ))
                        .build())
                .build();
    }

    private TextAIResponse.FilteredIndex createFilteredIndex(int start, int end, List<String> labels) {
        return TextAIResponse.FilteredIndex.builder()
                .sIdx(start)
                .eIdx(end)
                .detectedLabels(labels)
                .confidence(Map.of(labels.get(0), 0.8))
                .build();
    }
}