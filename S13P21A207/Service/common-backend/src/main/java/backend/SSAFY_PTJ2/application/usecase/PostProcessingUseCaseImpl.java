package backend.SSAFY_PTJ2.application.usecase;

import backend.SSAFY_PTJ2.adapter.api.dto.ImageAnalysisSocketResponse;
import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingResult;
import backend.SSAFY_PTJ2.domain.common.dto.UserSettings;
import backend.SSAFY_PTJ2.domain.common.service.SessionFilterService;
import backend.SSAFY_PTJ2.domain.imagefilter.ImageLabels;
import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageFilterSettings;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.image.ImageFilter;
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

    private final SessionFilterService sessionFilterService;
    private final ObjectMapper objectMapper;

    @Override
    public ProcessingResult executePostProcessing(ProcessingRequest originalRequest, AnalysisResult analysisResult, long actualProcessingTimeMs) {
        log.info("처리 후 작업 시작 - 요청 ID: {}, AI 처리시간: {}ms", originalRequest.getRequestId(), actualProcessingTimeMs);

        try {
            // 1. 사용자 설정 기반 필터링 적용
            UserSettings userSettings = getUserSettings(originalRequest.getSessionId());
            AnalysisResult filteredResult = applyUserSettings(analysisResult, userSettings);

            // 2. 분석 결과 캐시 저장 TODO 개발자 A
            // String cacheKey = generateCacheKey(originalRequest);
            // cacheAnalysisResult(cacheKey, filteredResult);

            // 3. 응답 형식으로 변환 (실제 AI 처리 시간 사용)
            ProcessingResult finalResult = convertToResponse(originalRequest, filteredResult, actualProcessingTimeMs, false);

            // 4. 메트릭 수집 TODO
            //collectPostProcessingMetrics(originalRequest, finalResult, actualProcessingTimeMs);

            log.info("처리 후 작업 완료 - 요청 ID: {}", originalRequest.getRequestId());
            return finalResult;

        } catch (Exception e) {
            log.error("처리 후 작업 실패 - 요청 ID: {}, 오류: {}", originalRequest.getRequestId(), e.getMessage(), e);
            return createErrorResult(originalRequest.getRequestId(), e.getMessage());
        }
    }

    /**
     * 사용자 설정 조회 (내부 헬퍼 메서드)
     */
    private UserSettings getUserSettings(String sessionId) {
        // SessionFilterService를 통해 사용자 설정 조회
        try {
            ImageFilterSettings imageSettings = sessionFilterService.getImageFilterSettings(sessionId);
            if (imageSettings != null) {
                return UserSettings.builder()
                    .sessionId(sessionId)
                    .imageFilterSettings(UserSettings.ImageFilterSettings.builder()
                        .enabled(true)
                        .enabledCategories(imageSettings.getEnabledFilters().stream()
                            .map(Enum::name)
                            .toList())
                        .build())
                    .build();
            }
        } catch (Exception e) {
            log.warn("사용자 설정 조회 실패 - sessionId: {}, error: {}", sessionId, e.getMessage());
        }
        return null;
    }

    /**
     * 캐시 키 생성 (내부 헬퍼 메서드)
     */
    private String generateCacheKey(ProcessingRequest request) {
        // TODO: 요청 정보를 기반으로 캐시 키 생성
        return request.getRequestId() + "_" + request.getType();
    }

    /**
     * 이미지 분석 결과 후처리
     */
    private ProcessingResult processImageAnalysisResult(ProcessingRequest originalRequest, AnalysisResult analysisResult) {
        String sessionId = originalRequest.getSessionId();
        log.debug("이미지 분석 결과 후처리 시작 - 세션: {}", sessionId);

        return createSuccessResult(originalRequest.getRequestId());
    }

    /**
     * 텍스트 분석 결과 후처리
     */
    private ProcessingResult processTextAnalysisResult(ProcessingRequest originalRequest, AnalysisResult analysisResult) {
        String sessionId = originalRequest.getSessionId();
        log.debug("텍스트 분석 결과 후처리 시작 - 세션: {}", sessionId);

        // TODO: SessionFilterService를 이용하여 사용자의 텍스트 필터 설정 가져오기
        // TODO: AnalysisResult에서 사용자가 활성화한 카테고리만 필터 적용 여부 판단
        // TODO: 최종 ProcessingResult 생성하여 반환

        return createSuccessResult(originalRequest.getRequestId());
    }

    /**
     * 성공 결과 생성 (임시 구현)
     */
    private ProcessingResult createSuccessResult(String requestId) {
        return ProcessingResult.builder()
            .requestId(requestId)
            .success(true)
            .processingTimeMs(0L)
            .fromCache(false)
            .build();
    }

    /**
     * 오류 결과 생성
     */
    private ProcessingResult createErrorResult(String requestId, String errorMessage) {
        return ProcessingResult.builder()
            .requestId(requestId)
            .success(false)
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

        if (analysisResult == null || !analysisResult.isSuccess()) {
            return analysisResult;
        }

        // 사용자 설정이 없으면 모든 혐오 이미지를 가리도록 처리
        if (userSettings == null) {
            log.info("사용자 설정이 없어서 AI가 혐오로 판단한 모든 이미지를 가립니다.");
            return applyDefaultFilteringPolicy(analysisResult);
        }

        // 이미지 결과 필터링
        List<AnalysisResult.ImageAnalysisItem> filteredImageResults = null;
        if (analysisResult.getImageResults() != null) {
            try {
                ImageFilterSettings imageFilterSettings = sessionFilterService.getImageFilterSettings(userSettings.getSessionId());
                if (imageFilterSettings != null) {
                    filteredImageResults = analysisResult.getImageResults().stream()
                        .map(imageResult -> {
                            // 사용자가 활성화한 카테고리 확인
                            boolean shouldFilter = imageResult.getDetectedCategories() != null &&
                                imageResult.getDetectedCategories().stream().anyMatch(category -> {
                                    try {
                                        ImageLabels label = ImageLabels.valueOf(category.toUpperCase());
                                        return imageFilterSettings.shouldFilter(label);
                                    } catch (IllegalArgumentException e) {
                                        return false;
                                    }
                                });

                            // 사용자가 필터링하지 않는 카테고리면 isHateful = false
                            if (!shouldFilter) {
                                return AnalysisResult.ImageAnalysisItem.builder()
                                    .imageId(imageResult.getImageId())
                                    .isHateful(false)
                                    .confidenceScore(imageResult.getConfidenceScore())
                                    .detectedCategories(imageResult.getDetectedCategories())
                                    .hatefulRegions(imageResult.getHatefulRegions())
                                    .build();
                            }
                            return imageResult; // 원본 유지
                        }).toList();
                } else {
                    filteredImageResults = analysisResult.getImageResults();
                }
            } catch (Exception e) {
                log.error("이미지 필터 적용 오류: {}", e.getMessage());
                filteredImageResults = analysisResult.getImageResults();
            }
        }

        // 새로운 AnalysisResult 생성
        return AnalysisResult.builder()
            .success(analysisResult.isSuccess())
            .analysisType(analysisResult.getAnalysisType())
            .imageResults(filteredImageResults)
            .textResults(analysisResult.getTextResults()) // 텍스트는 향후 구현
            .processingStats(analysisResult.getProcessingStats())
            .additionalData(analysisResult.getAdditionalData())
            .build();
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

        // ACK 응답 형식으로 변환 (사용자 설정이 이미 적용된 상태)
        ImageAnalysisSocketResponse ackResponseData = createSocketResponse(analysisResult, processingTimeMs);

        // ImageAnalysisSocketResponse를 Map으로 변환
        Map<String, Object> postProcessedDataMap = objectMapper.convertValue(ackResponseData, Map.class);

        return ProcessingResult.builder()
            .requestId(originalRequest.getRequestId())
            .success(true)
            .completedAt(LocalDateTime.now())
            .analysisResult(analysisResult)
            .postProcessedData(postProcessedDataMap) // ACK 응답용 데이터
            .processingTimeMs(processingTimeMs)
            .fromCache(fromCache)
            .build();
    }

    /**
     * AnalysisResult를 ImageAnalysisSocketResponse로 변환
     * 사용자 설정이 이미 적용된 AnalysisResult를 기반으로 최종 응답 생성
     */
    private ImageAnalysisSocketResponse createSocketResponse(AnalysisResult analysisResult, long processingTimeMs) {
        List<ImageAnalysisSocketResponse.ImageResultItem> results = new ArrayList<>();

        if (analysisResult != null && analysisResult.getImageResults() != null) {
            for (AnalysisResult.ImageAnalysisItem imageItem : analysisResult.getImageResults()) {
                boolean shouldBlur = imageItem.isHateful();

                // primaryCategory: shouldBlur가 true일 때만 첫 번째 카테고리 설정, false면 null
                String primaryCategory = null;
                if (shouldBlur &&
                    imageItem.getDetectedCategories() != null &&
                    !imageItem.getDetectedCategories().isEmpty()) {
                    primaryCategory = imageItem.getDetectedCategories().get(0);
                }

                ImageAnalysisSocketResponse.ImageResultItem resultItem =
                    ImageAnalysisSocketResponse.ImageResultItem.builder()
                        .elementId(imageItem.getImageId())
                        .shouldBlur(shouldBlur)
                        .confidence(imageItem.getConfidenceScore())
                        .primaryCategory(primaryCategory)
                        .build();

                results.add(resultItem);
            }
        }

        return ImageAnalysisSocketResponse.builder()
            .processingTime(processingTimeMs)
            .processedAt(java.time.Instant.now().toString())
            .results(results)
            .build();
    }

    /**
     * 사용자 설정이 없을 때 적용할 기본 필터링 정책
     * AI가 혐오로 판단한 모든 이미지를 가리도록 처리 (shouldBlur = true)
     */
    private AnalysisResult applyDefaultFilteringPolicy(AnalysisResult analysisResult) {
        List<AnalysisResult.ImageAnalysisItem> filteredImageResults = null;

        if (analysisResult.getImageResults() != null) {
            filteredImageResults = analysisResult.getImageResults().stream()
                .map(imageResult -> {
                    // AI가 혐오로 판단한 이미지는 모두 가림 (isHateful 유지)
                    // AI가 혐오가 아니라고 판단한 이미지는 그대로 유지
                    return imageResult;
                }).toList();
        }

        return AnalysisResult.builder()
            .success(analysisResult.isSuccess())
            .analysisType(analysisResult.getAnalysisType())
            .imageResults(filteredImageResults)
            .textResults(analysisResult.getTextResults())
            .processingStats(analysisResult.getProcessingStats())
            .additionalData(analysisResult.getAdditionalData())
            .build();
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