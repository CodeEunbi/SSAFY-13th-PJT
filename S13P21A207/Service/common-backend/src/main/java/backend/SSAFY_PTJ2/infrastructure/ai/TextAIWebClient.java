package backend.SSAFY_PTJ2.infrastructure.ai;

import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.global.response.exception.AIException;
import backend.SSAFY_PTJ2.domain.textfilter.dto.TextAIRequest;
import backend.SSAFY_PTJ2.domain.textfilter.dto.TextAIResponse;
import backend.SSAFY_PTJ2.global.config.AIClientProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import lombok.extern.slf4j.Slf4j;
import reactor.util.retry.Retry;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TextAIWebClient implements TextAIClient {

    private final WebClient textWebClient;   // WebClientConfig.textWebClient 빈 사용
    private final AIClientProperties props;

    /**
     * 텍스트 AI 컨테이너와 페이지 필터링 통신
     *
     * 🔗 AI 컨테이너 엔드포인트: POST /filter_page
     * 📝 요청 형태: JSON (텍스트 요소들의 배열)
     * 📡 통신 설정: application.yml의 ai.text.base-url (기본: http://localhost:8001)
     * 🔄 재시도: 최대 3회, 200ms 간격, 30% 지터
     */
    @Override
    public AnalysisResult analyze(TextAIRequest request) {
        // 1️⃣ 재시도 정책 설정 - 네트워크 오류나 5xx 에러 시 재시도
        Retry retrySpec = Retry.fixedDelay(
                        props.getRetry().getMaxAttempts(),  // 기본 3회
                        Duration.ofMillis(props.getRetry().getBackoffMs()))  // 기본 200ms
                .jitter(props.getRetry().getJitter())  // 기본 30% 지터로 재시도 분산
                .filter(t -> t instanceof AIException.ServerException || t instanceof WebClientRequestException)
                .doBeforeRetry(rs -> System.out.println("[TEXT-RETRY] attempt=" + (rs.totalRetries()+1)));

        try {

            // 2️⃣ 실제 AI 컨테이너로 HTTP 요청 전송
            TextAIResponse response = textWebClient.post()
                    .uri("/filter_page")  // 🎯 AI 컨테이너의 텍스트 필터링 엔드포인트
                    .contentType(MediaType.APPLICATION_JSON)  // JSON 형태로 전송
                    .bodyValue(request)  // 🔑 TextAIRequest 객체를 JSON으로 직렬화하여 전송
                    .retrieve()
                    // 에러 응답 처리 - 4xx는 클라이언트 오류, 5xx는 서버 오류
                    .onStatus(s -> s.is4xxClientError(), r ->
                            r.bodyToMono(String.class).defaultIfEmpty("")
                                    .map(b -> new AIException.ClientException("TEXT 4xx: " + b)))
                    .onStatus(s -> s.is5xxServerError(), r ->
                            r.bodyToMono(String.class).defaultIfEmpty("")
                                    .map(b -> new AIException.ServerException("TEXT 5xx: " + b)))
                    .bodyToMono(TextAIResponse.class)  // 🔄 JSON 응답을 TextAIResponse로 변환
                    .retryWhen(retrySpec)  // 재시도 정책 적용
                    .onErrorMap(WebClientRequestException.class,
                            ex -> new AIException.TransportException("TEXT transport error", ex))
                    .block();  // 동기적으로 결과 대기

            // 3️⃣ 핵심: AI 응답을 표준 AnalysisResult로 변환하여 반환
            return convertToAnalysisResult(response, request);
        } catch (WebClientResponseException e) {
            // HTTP 응답 오류 처리
            if (e.getStatusCode().is4xxClientError()) throw new AIException.ClientException(e.getMessage(), e);
            if (e.getStatusCode().is5xxServerError()) throw new AIException.ServerException(e.getMessage(), e);
            throw e;
        } catch (WebClientRequestException e) {
            // 네트워크 연결 오류 처리
            throw new AIException.TransportException("TEXT transport error", e);
        }
    }

    @Override
    public boolean health() {
        try {
            textWebClient.get().uri("/health")
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private AnalysisResult convertToAnalysisResult(TextAIResponse response, TextAIRequest request) {

        // 디버그용, 이것을 그대로 ai컨테이너에게 postman으로 보내주어서 디버깅 가능
        printTextAIRequestAsJson(request);

        if (response == null || !response.isSuccess()) {
            return AnalysisResult.builder()
                    .success(false)
                    .analysisType("TEXT")
                    .textResults(List.of())  // 오류 시에는 빈 리스트 반환
                    .processingStats(AnalysisResult.ProcessingStats.builder()
                            .totalRequested(request.getTextElements() != null ? request.getTextElements().size() : 0)
                            .successfullyProcessed(0)
                            .failed(request.getTextElements() != null ? request.getTextElements().size() : 0)
                            .hatefulCount(0)
                            .build())
                    .build();
        }

        // 새로운 응답 구조에 맞게 직접 변환
        var textResults = response.getFilteredElements().stream()
                .map(filteredElement -> {
                    // 원본 요청에서 해당 elementId의 텍스트 길이 찾기
                    int originalLength = request.getTextElements().stream()
                            .filter(element -> element.getElementId().equals(filteredElement.getElementId()))
                            .findFirst()
                            .map(element -> element.getTexts().get(0).getText().length())
                            .orElse(0);

                    // FilteredText들을 TextRange로 변환 (detectedLabels를 category에 직접 대응)
                    var hatefulRanges = filteredElement.getFilteredTexts().stream()
                            .map(filteredText -> {
                                // detectedLabels가 비어있으면 빈 리스트, 있으면 그대로 사용
                                List<String> categories = filteredText.getDetectedLabels();

                                // confidence에서 최대값 계산 (여러 카테고리 중 가장 높은 신뢰도)
                                double maxScore = filteredText.getConfidence().values().stream()
                                        .mapToDouble(Double::doubleValue)
                                        .max().orElse(0.0);

                                return AnalysisResult.TextRange.builder()
                                        .startIndex(filteredText.getSIdx())
                                        .endIndex(filteredText.getEIdx())
                                        .category(categories)  // detectedLabels를 그대로 대응
                                        .score(maxScore)
                                        .build();
                            })
                            .toList();

                    return AnalysisResult.TextAnalysisItem.builder()
                            .elementId(filteredElement.getElementId())
                            .hatefulRanges(hatefulRanges)
                            .originalLength(originalLength)
                            .build();
                })
                .toList();

        // 통계 계산
        int totalRequested = request.getTextElements() != null ? request.getTextElements().size() : 0;
        int successfullyProcessed = response.getFilteredElements().size();
        int hatefulCount = (int) textResults.stream()
                .filter(item -> !item.getHatefulRanges().isEmpty())
                .count();

        return AnalysisResult.builder()
                .success(true)
                .analysisType("TEXT")
                .textResults(textResults)
                .processingStats(AnalysisResult.ProcessingStats.builder()
                        .totalRequested(totalRequested)
                        .successfullyProcessed(successfullyProcessed)
                        .failed(totalRequested - successfullyProcessed)
                        .hatefulCount(hatefulCount)
                        .build())
                .build();
    }

    /**
     * 디버그용: TextAIRequest를 예쁜 JSON 형태로 출력
     */
    private void printTextAIRequestAsJson(TextAIRequest request) {
        StringBuilder sb = new StringBuilder();
        try {
            ObjectMapper mapper = new ObjectMapper();
            String jsonString = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(request);

            sb.append("=== TextAIRequest JSON ===");
            sb.append(jsonString);
            sb.append("==========================");
            sb.append("컨테이너 테스트용 curl 명령:");
            sb.append("curl -X POST http://localhost:8002/filter_page \\");
            sb.append("  -H \"Content-Type: application/json\" \\");
            sb.append("  -d '" + jsonString.replace("\n", "").replace("  ", " ") + "'");
            sb.append("==========================");

            log.debug(sb.toString());
        } catch (Exception e) {
            System.out.println("JSON 변환 실패: " + e.getMessage());
        }

    }
}
