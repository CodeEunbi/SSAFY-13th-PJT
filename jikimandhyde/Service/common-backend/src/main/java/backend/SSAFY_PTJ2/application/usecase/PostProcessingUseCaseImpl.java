package backend.SSAFY_PTJ2.application.usecase;

import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingResult;
import backend.SSAFY_PTJ2.domain.common.dto.UserSettings;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 처리 후 유즈케이스 구현체 - 개발자 D 담당
 *
 * AI 분석 완료 후 수행할 작업들을 구현합니다.
 * 캐시 저장, 개인 설정 적용, 응답 변환 등을 담당합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostProcessingUseCaseImpl implements PostProcessingUseCase {

    @Override
    public ProcessingResult executePostProcessing(ProcessingRequest originalRequest, AnalysisResult analysisResult) {
        log.info("처리 후 작업 시작 - 요청 ID: {}", originalRequest.getRequestId());

        // TODO: 개발자 D가 후처리 로직 구현
        // 임시로 기본 결과 반환
        return ProcessingResult.builder()
            .requestId(originalRequest.getRequestId())
            .success(true)
            .processingTimeMs(0L)
            .fromCache(false)
            .build();
    }

    @Override
    public void cacheAnalysisResult(String cacheKey, AnalysisResult analysisResult) {
        log.debug("분석 결과 캐시 저장 - 키: {}", cacheKey);

        // TODO: 개발자 D가 캐시 저장 로직 구현
    }

    @Override
    public AnalysisResult applyUserSettings(AnalysisResult analysisResult, UserSettings userSettings) {
        log.debug("개인 설정 적용 - 사용자 ID: {}", userSettings != null ? userSettings.getSessionId() : "null");

        // TODO: 개발자 D가 개인 설정 적용 로직 구현
        // 현재는 원본 결과 그대로 반환
        return analysisResult;
    }

    @Override
    public ProcessingResult convertToResponse(
        ProcessingRequest originalRequest,
        AnalysisResult analysisResult,
        long processingTimeMs,
        boolean fromCache
    ) {
        log.debug("응답 변환 - 요청 ID: {}, 처리시간: {}ms, 캐시: {}",
            originalRequest.getRequestId(), processingTimeMs, fromCache);

        // 임시 구현: ACK 응답 형식으로 변환 (사용자 설정 무시, hateful = shouldBlur)
        Map<String, Object> ackResponseData = createTempAckResponse(analysisResult, processingTimeMs);

        return ProcessingResult.builder()
            .requestId(originalRequest.getRequestId())
            .success(true)
            .completedAt(LocalDateTime.now())
            .analysisResult(analysisResult)
            .postProcessedData(ackResponseData) // ACK 응답용 데이터
            .processingTimeMs(processingTimeMs)
            .fromCache(fromCache)
            .build();
    }

    /**
     * 임시 구현: AnalysisResult를 ACK 응답 형식으로 변환
     * 사용자 설정은 무시하고 hateful = shouldBlur로 단순 변환
     */
    private Map<String, Object> createTempAckResponse(AnalysisResult analysisResult, long processingTimeMs) {
        List<Map<String, Object>> results = new ArrayList<>();

        if (analysisResult != null && analysisResult.getImageResults() != null) {
            for (AnalysisResult.ImageAnalysisItem imageItem : analysisResult.getImageResults()) {
                Map<String, Object> resultItem = new HashMap<>();
                resultItem.put("elementId", imageItem.getImageId());
                resultItem.put("shouldBlur", imageItem.isHateful()); // 임시: hateful = shouldBlur
                resultItem.put("confidence", imageItem.getConfidenceScore());

                // primaryCategory: shouldBlur가 true면 첫 번째 카테고리, false면 null
                String primaryCategory = null;
                if (imageItem.isHateful() &&
                    imageItem.getDetectedCategories() != null &&
                    !imageItem.getDetectedCategories().isEmpty()) {
                    primaryCategory = imageItem.getDetectedCategories().get(0);
                }
                resultItem.put("primaryCategory", primaryCategory);

                results.add(resultItem);
            }
        }

        Map<String, Object> ackResponse = new HashMap<>();
        ackResponse.put("processingTime", processingTimeMs);
        ackResponse.put("processedAt", java.time.Instant.now().toString());
        ackResponse.put("results", results);

        return ackResponse;
    }

    @Override
    public void collectPostProcessingMetrics(
        ProcessingRequest originalRequest,
        ProcessingResult processingResult,
        long processingTimeMs
    ) {
        log.debug("처리 후 메트릭 수집 - 요청 ID: {}, 성공: {}, 처리시간: {}ms",
            originalRequest.getRequestId(), processingResult.isSuccess(), processingTimeMs);

        // TODO: 개발자 D가 메트릭 수집 로직 구현
    }
}