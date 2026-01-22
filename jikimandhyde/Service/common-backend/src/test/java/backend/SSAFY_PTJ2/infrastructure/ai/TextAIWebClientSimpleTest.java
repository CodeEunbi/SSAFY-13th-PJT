package backend.SSAFY_PTJ2.infrastructure.ai;

import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.textfilter.TextLabels;
import backend.SSAFY_PTJ2.domain.textfilter.converter.TextAnalysisConverter;
import backend.SSAFY_PTJ2.domain.textfilter.dto.TextAIRequest;
import backend.SSAFY_PTJ2.domain.textfilter.dto.TextAIResponse;
import backend.SSAFY_PTJ2.global.config.AIClientProperties;
import backend.SSAFY_PTJ2.global.response.exception.AIException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * TextAIWebClient 단위 테스트 - 순수 Mockito 사용
 * WireMock 의존성 문제를 피하고 핵심 로직만 테스트
 */
class TextAIWebClientSimpleTest {

    @Mock
    private WebClient mockWebClient;
    @Mock
    private WebClient.RequestBodyUriSpec mockRequestBodyUriSpec;
    @Mock
    private WebClient.RequestBodySpec mockRequestBodySpec;
    @Mock
    private WebClient.RequestHeadersSpec mockRequestHeadersSpec;
    @Mock
    private WebClient.ResponseSpec mockResponseSpec;
    @Mock
    private TextAnalysisConverter mockConverter;
    @Mock
    private AIClientProperties mockProps;
    @Mock
    private AIClientProperties.Retry mockRetry;

    private TextAIWebClient textAIWebClient;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Mock Properties 설정
        when(mockProps.getRetry()).thenReturn(mockRetry);
        when(mockRetry.getMaxAttempts()).thenReturn(3);
        when(mockRetry.getBackoffMs()).thenReturn(1000L);
        when(mockRetry.getJitter()).thenReturn(0.1);

        textAIWebClient = new TextAIWebClient(mockWebClient, mockProps, mockConverter);
    }

    @Test
    void analyze_성공_테스트() {
        // Given
        TextAIRequest request = createTextAIRequest();
        TextAIResponse mockResponse = createSuccessResponse();

        // WebClient Mock 체인 설정
        setupWebClientMocks(mockResponse);

        // Converter Mock 설정 - 깨끗한 텍스트
        when(mockConverter.convert(any(TextAIResponse.class)))
                .thenReturn(List.of(new TextAnalysisConverter.ElementSpanResult(
                        "text1", List.of())));

        // When
        AnalysisResult result = textAIWebClient.analyze(request);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getAnalysisType()).isEqualTo("TEXT");
        assertThat(result.getTextResults()).hasSize(1);
        assertThat(result.getTextResults().get(0).getElementId()).isEqualTo("text1");
        assertThat(result.getTextResults().get(0).getHatefulRanges()).isEmpty();

        // Verify
        verify(mockWebClient).post();
        verify(mockConverter).convert(mockResponse);
    }

    @Test
    void analyze_혐오_표현_감지_테스트() {
        // Given
        TextAIRequest request = createTextAIRequest();
        TextAIResponse mockResponse = createSuccessResponse();

        setupWebClientMocks(mockResponse);

        // Converter Mock 설정 - 혐오 표현 감지
        when(mockConverter.convert(any(TextAIResponse.class)))
                .thenReturn(List.of(new TextAnalysisConverter.ElementSpanResult(
                        "text1",
                        List.of(new TextAnalysisConverter.ElementSpanResult.Span(
                                10, 20,
                                List.of(TextLabels.INSULT),
                                Map.of(TextLabels.INSULT, 0.9))))));

        // When
        AnalysisResult result = textAIWebClient.analyze(request);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getTextResults()).hasSize(1);
        assertThat(result.getTextResults().get(0).getHatefulRanges()).hasSize(1);

        AnalysisResult.TextRange range = result.getTextResults().get(0).getHatefulRanges().get(0);
        assertThat(range.getStartIndex()).isEqualTo(10);
        assertThat(range.getEndIndex()).isEqualTo(20);
        assertThat(range.getCategory()).isEqualTo("INSULT");
        assertThat(range.getScore()).isEqualTo(0.9);

        assertThat(result.getProcessingStats().getHatefulCount()).isEqualTo(1);
    }

    @Test
    void analyze_AI_실패_응답_테스트() {
        // Given
        TextAIRequest request = createTextAIRequest();
        TextAIResponse failureResponse = TextAIResponse.builder()
                .isSuccess(false)
                .code("500")
                .message("AI processing failed")
                .result(null)
                .build();

        setupWebClientMocks(failureResponse);

        // When
        AnalysisResult result = textAIWebClient.analyze(request);

        // Then
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getTextResults()).isEmpty();
        assertThat(result.getProcessingStats().getSuccessfullyProcessed()).isEqualTo(0);
    }

    @Test
    void analyze_WebClient_예외_처리_테스트() {
        // Given
        TextAIRequest request = createTextAIRequest();

        // WebClient에서 예외 발생 설정
        when(mockWebClient.post()).thenReturn(mockRequestBodyUriSpec);
        when(mockRequestBodyUriSpec.uri("/filter_page")).thenReturn(mockRequestBodySpec);
        when(mockRequestBodySpec.contentType(any())).thenReturn(mockRequestBodySpec);
        when(mockRequestBodySpec.bodyValue(any())).thenReturn(mockRequestHeadersSpec);
        when(mockRequestHeadersSpec.retrieve()).thenReturn(mockResponseSpec);
        when(mockResponseSpec.onStatus(any(), any())).thenReturn(mockResponseSpec);
        when(mockResponseSpec.bodyToMono(TextAIResponse.class))
                .thenReturn(Mono.error(WebClientResponseException.create(400, "Bad Request", null, null, null)));

        // When & Then
        assertThatThrownBy(() -> textAIWebClient.analyze(request))
                .isInstanceOf(AIException.ClientException.class);
    }

    @Test
    void analyze_다중_요소_처리_테스트() {
        // Given
        TextAIRequest request = createMultiElementTextRequest();
        TextAIResponse mockResponse = createSuccessResponse();

        setupWebClientMocks(mockResponse);

        // Converter Mock 설정 - 다중 요소
        when(mockConverter.convert(any(TextAIResponse.class)))
                .thenReturn(List.of(
                        new TextAnalysisConverter.ElementSpanResult("text1", List.of()),
                        new TextAnalysisConverter.ElementSpanResult("text2",
                                List.of(new TextAnalysisConverter.ElementSpanResult.Span(
                                        5, 15,
                                        List.of(TextLabels.VIOLENCE),
                                        Map.of(TextLabels.VIOLENCE, 0.85))))));

        // When
        AnalysisResult result = textAIWebClient.analyze(request);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getTextResults()).hasSize(2);
        assertThat(result.getTextResults().get(0).getHatefulRanges()).isEmpty();
        assertThat(result.getTextResults().get(1).getHatefulRanges()).hasSize(1);
        assertThat(result.getProcessingStats().getHatefulCount()).isEqualTo(1);
    }

    @Test
    void analyze_빈_텍스트_요소_처리_테스트() {
        // Given
        TextAIRequest emptyRequest = TextAIRequest.builder()
                .pageUrl("https://example.com")
                .textElements(List.of())
                .textFilterCategory(Map.of("IN", true))
                .threshold(0.8)
                .build();

        TextAIResponse mockResponse = createSuccessResponse();
        setupWebClientMocks(mockResponse);

        when(mockConverter.convert(any(TextAIResponse.class)))
                .thenReturn(List.of());

        // When
        AnalysisResult result = textAIWebClient.analyze(emptyRequest);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getTextResults()).isEmpty();
        assertThat(result.getProcessingStats().getTotalRequested()).isEqualTo(0);
    }

    @Test
    void health_성공_테스트() {
        // Given
        WebClient.RequestHeadersUriSpec mockGetUriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec mockGetHeadersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec mockGetResponseSpec = mock(WebClient.ResponseSpec.class);

        when(mockWebClient.get()).thenReturn(mockGetUriSpec);
        when(mockGetUriSpec.uri("/health")).thenReturn(mockGetHeadersSpec);
        when(mockGetHeadersSpec.retrieve()).thenReturn(mockGetResponseSpec);
        when(mockGetResponseSpec.toBodilessEntity()).thenReturn(Mono.just(mock(org.springframework.http.ResponseEntity.class)));

        // When
        boolean isHealthy = textAIWebClient.health();

        // Then
        assertThat(isHealthy).isTrue();
    }

    @Test
    void health_실패_테스트() {
        // Given
        WebClient.RequestHeadersUriSpec mockGetUriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec mockGetHeadersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec mockGetResponseSpec = mock(WebClient.ResponseSpec.class);

        when(mockWebClient.get()).thenReturn(mockGetUriSpec);
        when(mockGetUriSpec.uri("/health")).thenReturn(mockGetHeadersSpec);
        when(mockGetHeadersSpec.retrieve()).thenReturn(mockGetResponseSpec);
        when(mockGetResponseSpec.toBodilessEntity()).thenReturn(Mono.error(new RuntimeException("Connection failed")));

        // When
        boolean isHealthy = textAIWebClient.health();

        // Then
        assertThat(isHealthy).isFalse();
    }

    private void setupWebClientMocks(TextAIResponse response) {
        when(mockWebClient.post()).thenReturn(mockRequestBodyUriSpec);
        when(mockRequestBodyUriSpec.uri("/filter_page")).thenReturn(mockRequestBodySpec);
        when(mockRequestBodySpec.contentType(any())).thenReturn(mockRequestBodySpec);
        when(mockRequestBodySpec.bodyValue(any())).thenReturn(mockRequestHeadersSpec);
        when(mockRequestHeadersSpec.retrieve()).thenReturn(mockResponseSpec);
        when(mockResponseSpec.onStatus(any(), any())).thenReturn(mockResponseSpec);
        when(mockResponseSpec.bodyToMono(TextAIResponse.class)).thenReturn(Mono.just(response));
    }

    private TextAIRequest createTextAIRequest() {
        return TextAIRequest.builder()
                .pageUrl("https://example.com/test")
                .textElements(List.of(
                        TextAIRequest.TextElement.builder()
                                .elementId("text1")
                                .texts(List.of(
                                        TextAIRequest.TextData.builder()
                                                .text("This is a test text")
                                                .sIdx(0)
                                                .eIdx(19)
                                                .build()
                                ))
                                .build()
                ))
                .textFilterCategory(Map.of(
                        "IN", true,
                        "VI", true,
                        "SE", false
                ))
                .threshold(0.8)
                .build();
    }

    private TextAIRequest createMultiElementTextRequest() {
        return TextAIRequest.builder()
                .pageUrl("https://example.com/test")
                .textElements(List.of(
                        TextAIRequest.TextElement.builder()
                                .elementId("text1")
                                .texts(List.of(
                                        TextAIRequest.TextData.builder()
                                                .text("Clean text")
                                                .sIdx(0)
                                                .eIdx(10)
                                                .build()
                                ))
                                .build(),
                        TextAIRequest.TextElement.builder()
                                .elementId("text2")
                                .texts(List.of(
                                        TextAIRequest.TextData.builder()
                                                .text("Some violent content here")
                                                .sIdx(0)
                                                .eIdx(25)
                                                .build()
                                ))
                                .build()
                ))
                .textFilterCategory(Map.of("VI", true, "IN", true))
                .threshold(0.7)
                .build();
    }

    private TextAIResponse createSuccessResponse() {
        return TextAIResponse.builder()
                .isSuccess(true)
                .code("200")
                .message("Success")
                .result(TextAIResponse.TextAnalysisResult.builder()
                        .blurredTextsInfo(List.of())
                        .build())
                .build();
    }
}