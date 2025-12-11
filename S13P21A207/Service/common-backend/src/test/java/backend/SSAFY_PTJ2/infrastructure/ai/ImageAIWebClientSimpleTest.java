package backend.SSAFY_PTJ2.infrastructure.ai;

import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.imagefilter.ImageLabels;
import backend.SSAFY_PTJ2.domain.imagefilter.converter.ImageAnalysisConverter;
import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageAIRequest;
import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageAIResponse;
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

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * ImageAIWebClient 단위 테스트 - MockWebServer 없이 순수 Mockito 사용
 * WireMock 의존성 문제를 피하고 핵심 로직만 테스트
 */
class ImageAIWebClientSimpleTest {

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
    private ImageAnalysisConverter mockConverter;
    @Mock
    private AIClientProperties mockProps;
    @Mock
    private AIClientProperties.Retry mockRetry;

    private ImageAIWebClient imageAIWebClient;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Mock Properties 설정
        when(mockProps.getRetry()).thenReturn(mockRetry);
        when(mockRetry.getMaxAttempts()).thenReturn(3);
        when(mockRetry.getBackoffMs()).thenReturn(1000L);
        when(mockRetry.getJitter()).thenReturn(0.1);

        imageAIWebClient = new ImageAIWebClient(mockWebClient, mockProps, mockConverter);
    }

    @Test
    void analyze_성공_테스트() {
        // Given
        ImageAIRequest request = createImageAIRequest();
        ImageAIResponse mockResponse = createSuccessResponse();

        // WebClient Mock 체인 설정
        when(mockWebClient.post()).thenReturn(mockRequestBodyUriSpec);
        when(mockRequestBodyUriSpec.uri("/predict/batch")).thenReturn(mockRequestBodySpec);
        when(mockRequestBodySpec.contentType(any())).thenReturn(mockRequestBodySpec);
        when(mockRequestBodySpec.body(any())).thenReturn(mockRequestHeadersSpec);
        when(mockRequestHeadersSpec.retrieve()).thenReturn(mockResponseSpec);
        when(mockResponseSpec.onStatus(any(), any())).thenReturn(mockResponseSpec);
        when(mockResponseSpec.bodyToMono(ImageAIResponse.class)).thenReturn(Mono.just(mockResponse));

        // Converter Mock 설정
        when(mockConverter.convert(any(ImageAIResponse.class)))
                .thenReturn(List.of(new ImageAnalysisConverter.ImageResult(
                        "img1", "test.jpg", ImageLabels.CLEAN, 0.95)));

        // When
        AnalysisResult result = imageAIWebClient.analyze(request);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getAnalysisType()).isEqualTo("IMAGE");
        assertThat(result.getImageResults()).hasSize(1);
        assertThat(result.getImageResults().get(0).getImageId()).isEqualTo("img1");
        assertThat(result.getImageResults().get(0).isHateful()).isFalse();
        assertThat(result.getImageResults().get(0).getConfidenceScore()).isEqualTo(0.95);

        // Verify
        verify(mockWebClient).post();
        verify(mockConverter).convert(mockResponse);
    }

    @Test
    void analyze_혐오_컨텐츠_감지_테스트() {
        // Given
        ImageAIRequest request = createImageAIRequest();
        ImageAIResponse mockResponse = createSuccessResponse();

        // WebClient Mock 체인 설정
        setupWebClientMocks(mockResponse);

        // Converter Mock 설정 - 혐오 컨텐츠
        when(mockConverter.convert(any(ImageAIResponse.class)))
                .thenReturn(List.of(new ImageAnalysisConverter.ImageResult(
                        "img1", "hateful.jpg", ImageLabels.GORE, 0.87)));

        // When
        AnalysisResult result = imageAIWebClient.analyze(request);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getImageResults()).hasSize(1);
        assertThat(result.getImageResults().get(0).isHateful()).isTrue();
        assertThat(result.getImageResults().get(0).getDetectedCategories()).contains("GORE");
        assertThat(result.getProcessingStats().getHatefulCount()).isEqualTo(1);
    }

    @Test
    void analyze_파일_검증_실패_테스트() {
        // Given - 잘못된 MIME 타입
        ImageAIRequest invalidRequest = ImageAIRequest.builder()
                .imageFiles(List.of(
                        ImageAIRequest.ImageFile.builder()
                                .id("img1")
                                .filename("test.txt")
                                .imageData("test data".getBytes())
                                .mimeType("text/plain")  // 잘못된 타입
                                .size(100L)
                                .build()
                ))
                .build();

        // When & Then
        assertThatThrownBy(() -> imageAIWebClient.analyze(invalidRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported image type");
    }

    @Test
    void analyze_WebClient_예외_처리_테스트() {
        // Given
        ImageAIRequest request = createImageAIRequest();

        // WebClient에서 예외 발생 설정
        when(mockWebClient.post()).thenReturn(mockRequestBodyUriSpec);
        when(mockRequestBodyUriSpec.uri("/predict/batch")).thenReturn(mockRequestBodySpec);
        when(mockRequestBodySpec.contentType(any())).thenReturn(mockRequestBodySpec);
        when(mockRequestBodySpec.body(any())).thenReturn(mockRequestHeadersSpec);
        when(mockRequestHeadersSpec.retrieve()).thenReturn(mockResponseSpec);
        when(mockResponseSpec.onStatus(any(), any())).thenReturn(mockResponseSpec);
        when(mockResponseSpec.bodyToMono(ImageAIResponse.class))
                .thenReturn(Mono.error(WebClientResponseException.create(500, "Internal Server Error", null, null, null)));

        // When & Then
        assertThatThrownBy(() -> imageAIWebClient.analyze(request))
                .isInstanceOf(AIException.ServerException.class);
    }

    @Test
    void analyze_빈_응답_처리_테스트() {
        // Given
        ImageAIRequest request = createImageAIRequest();
        ImageAIResponse emptyResponse = ImageAIResponse.builder().build();

        // WebClient Mock 설정
        setupWebClientMocks(emptyResponse);

        when(mockConverter.convert(any(ImageAIResponse.class)))
                .thenReturn(List.of());

        // When
        AnalysisResult result = imageAIWebClient.analyze(request);

        // Then
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getImageResults()).isEmpty();
        assertThat(result.getProcessingStats().getSuccessfullyProcessed()).isEqualTo(0);
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
        boolean isHealthy = imageAIWebClient.health();

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
        boolean isHealthy = imageAIWebClient.health();

        // Then
        assertThat(isHealthy).isFalse();
    }

    private void setupWebClientMocks(ImageAIResponse response) {
        when(mockWebClient.post()).thenReturn(mockRequestBodyUriSpec);
        when(mockRequestBodyUriSpec.uri("/predict/batch")).thenReturn(mockRequestBodySpec);
        when(mockRequestBodySpec.contentType(any())).thenReturn(mockRequestBodySpec);
        when(mockRequestBodySpec.body(any())).thenReturn(mockRequestHeadersSpec);
        when(mockRequestHeadersSpec.retrieve()).thenReturn(mockResponseSpec);
        when(mockResponseSpec.onStatus(any(), any())).thenReturn(mockResponseSpec);
        when(mockResponseSpec.bodyToMono(ImageAIResponse.class)).thenReturn(Mono.just(response));
    }

    private ImageAIRequest createImageAIRequest() {
        return ImageAIRequest.builder()
                .imageFiles(List.of(
                        ImageAIRequest.ImageFile.builder()
                                .id("img1")
                                .filename("test.jpg")
                                .imageData("test image data".getBytes())
                                .mimeType("image/jpeg")
                                .size(1024L)
                                .build()
                ))
                .build();
    }

    private ImageAIResponse createSuccessResponse() {
        return ImageAIResponse.builder()
                .results(List.of(
                        ImageAIResponse.ImageAnalysisResult.builder()
                                .id("img1")
                                .filename("test.jpg")
                                .label("clean")
                                .prob(0.95)
                                .build()
                ))
                .imageCount(ImageAIResponse.ImageCount.builder()
                        .processedImages(1)
                        .skippedImages(0)
                        .build())
                .build();
    }
}