package backend.SSAFY_PTJ2.infrastructure.ai;

import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.imagefilter.converter.ImageAnalysisConverter;
import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageAIRequest;
import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageAIResponse;
import backend.SSAFY_PTJ2.global.response.exception.AIException;
import backend.SSAFY_PTJ2.global.config.AIClientProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.*;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ImageAIWebClient implements ImageAIClient {

    private final WebClient imageWebClient;   // WebClientConfig.imageWebClient() 빈
    private final AIClientProperties props;
    private final ImageAnalysisConverter converter;

    /**
     * 이미지 AI 컨테이너와 배치 분석 통신
     *
     * 🔗 AI 컨테이너 엔드포인트: POST /predict/batch
     * 📝 요청 형태: Multipart Form Data (여러 이미지 파일)
     * 📡 통신 설정: application.yml의 ai.image.base-url (기본: http://localhost:8001)
     * 🔄 재시도: 최대 3회, 200ms 간격, 30% 지터
     */
    @Override
    public AnalysisResult analyze(ImageAIRequest request) {
        // 1️⃣ 사전 검증: Content-Type 및 파일 크기 검증 (JPEG/PNG/WebP, 최대 10MB)
        request.validateImageFiles();

        // 2️⃣ Multipart 요청 바디 구성 - AI 컨테이너가 요구하는 형식 (동적 key를 ID로 사용)
        MultipartBodyBuilder mb = new MultipartBodyBuilder();
        request.getImageFiles().forEach(img -> {
            // 바이트 배열을 ByteArrayResource로 감싸서 파일명과 MIME 타입 포함
            ByteArrayResource bin = new ByteArrayResource(img.getImageData()) {
                @Override public String getFilename() { return img.getFilename(); }
            };
            // 🔑 AI 컨테이너가 key 자체를 ID로 사용하므로 img.getId()를 key로 설정
            mb.part(img.getId(), bin)
                    .filename(img.getFilename())
                    .contentType(MediaType.parseMediaType(img.getMimeType()));
        });

        // 3️⃣ 재시도 정책 설정 - 네트워크 오류나 5xx 에러 시 재시도
        Retry retrySpec = Retry.fixedDelay(
                        props.getRetry().getMaxAttempts(),  // 기본 3회
                        Duration.ofMillis(props.getRetry().getBackoffMs()))  // 기본 200ms
                .jitter(props.getRetry().getJitter())  // 기본 30% 지터로 재시도 분산
                .filter(this::isRetriable)  // 재시도 가능한 예외만 필터링
                .doBeforeRetry(rs -> {
                    long attempt = rs.totalRetries() + 1;
                    System.out.println("[IMG-RETRY] attempt=" + attempt + ", reason=" + rs.failure());
                });

        try {
            // 4️⃣ 실제 AI 컨테이너로 HTTP 요청 전송
            ImageAIResponse response = imageWebClient.post()
                    .uri("/predict/batch")  // 🎯 AI 컨테이너의 배치 분석 엔드포인트
                    .contentType(MediaType.MULTIPART_FORM_DATA)  // Form-data 전송
                    .body(BodyInserters.fromMultipartData(mb.build()))
                    .retrieve()
                    // 에러 응답 처리 - 4xx는 클라이언트 오류, 5xx는 서버 오류
                    .onStatus(s -> s.is4xxClientError(), res ->
                            res.bodyToMono(String.class)
                                    .defaultIfEmpty("")
                                    .flatMap(b -> Mono.error(new AIException.ClientException(
                                            "AI 4xx: " + res.statusCode() + " " + b)))
                    )
                    .onStatus(s -> s.is5xxServerError(), res ->
                            res.bodyToMono(String.class)
                                    .defaultIfEmpty("")
                                    .flatMap(b -> Mono.error(new AIException.ServerException(
                                            "AI 5xx: " + res.statusCode() + " " + b)))
                    )
                    .bodyToMono(ImageAIResponse.class)  // 🔄 JSON 응답을 ImageAIResponse로 변환
                    .retryWhen(retrySpec)  // 재시도 정책 적용
                    .onErrorMap(WebClientRequestException.class,
                            ex -> new AIException.TransportException("AI transport error", ex))
                    .block();  // 동기적으로 결과 대기

            // 5️⃣ 핵심: AI 응답을 표준 AnalysisResult로 변환하여 반환
            return convertToAnalysisResult(response, request);
        } catch (WebClientResponseException e) {
            // HTTP 응답 오류 처리
            if (e.getStatusCode().is4xxClientError())
                throw new AIException.ClientException("AI 4xx: " + e.getMessage(), e);
            if (e.getStatusCode().is5xxServerError())
                throw new AIException.ServerException("AI 5xx: " + e.getMessage(), e);
            throw e;
        } catch (WebClientRequestException e) {
            // 네트워크 연결 오류 처리
            throw new AIException.TransportException("AI transport error", e);
        }
    }

    @Override
    public boolean health() {
        try {
            imageWebClient.get().uri("/health").retrieve().toBodilessEntity().block();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isRetriable(Throwable t) {
        return t instanceof AIException.ServerException
                || t instanceof AIException.TransportException
                || t instanceof WebClientRequestException;
    }

    private AnalysisResult convertToAnalysisResult(ImageAIResponse response, ImageAIRequest request) {
        if (response == null || response.getResults() == null) {
            return AnalysisResult.builder()
                    .success(false)
                    .analysisType("IMAGE")
                    .imageResults(List.of())
                    .processingStats(AnalysisResult.ProcessingStats.builder()
                            .totalRequested(request.getImageFiles().size())
                            .successfullyProcessed(0)
                            .failed(request.getImageFiles().size())
                            .hatefulCount(0)
                            .processedImages(0)
                            .skippedImages(request.getImageFiles().size())
                            .build())
                    .build();
        }

        // Converter를 사용해 ImageAIResponse -> ImageResult 변환
        var convertedResults = converter.convert(response);

        // ImageResult -> AnalysisResult.ImageAnalysisItem 변환
        var imageResults = convertedResults.stream()
                .map(result -> AnalysisResult.ImageAnalysisItem.builder()
                        .imageId(result.id())
                        .isHateful(!result.label().name().equals("CLEAN"))
                        .confidenceScore(result.prob())
                        .detectedCategories(List.of(result.label().name()))
                        .hatefulRegions(List.of()) // 현재는 영역 정보 없음
                        .build())
                .toList();

        // 통계 계산
        int totalRequested = request.getImageFiles().size();
        int successfullyProcessed = convertedResults.size();
        int hatefulCount = (int) imageResults.stream()
                .filter(AnalysisResult.ImageAnalysisItem::isHateful)
                .count();
        int processedImages = response.getImageCount() != null ?
                response.getImageCount().getProcessedImages() : successfullyProcessed;
        int skippedImages = response.getImageCount() != null ?
                response.getImageCount().getSkippedImages() :
                totalRequested - successfullyProcessed;

        return AnalysisResult.builder()
                .success(true)
                .analysisType("IMAGE")
                .imageResults(imageResults)
                .processingStats(AnalysisResult.ProcessingStats.builder()
                        .totalRequested(totalRequested)
                        .successfullyProcessed(successfullyProcessed)
                        .failed(skippedImages)
                        .hatefulCount(hatefulCount)
                        .processedImages(processedImages)
                        .skippedImages(skippedImages)
                        .build())
                .build();
    }
}
