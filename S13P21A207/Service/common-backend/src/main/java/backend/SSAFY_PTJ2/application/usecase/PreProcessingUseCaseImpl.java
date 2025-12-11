package backend.SSAFY_PTJ2.application.usecase;

import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingResult;
import backend.SSAFY_PTJ2.domain.common.dto.UserSettings;
import backend.SSAFY_PTJ2.domain.common.service.SessionFilterService;
import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageFilterSettings;
import backend.SSAFY_PTJ2.domain.textfilter.dto.TextFilterSettings;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * 처리 전 유즈케이스 구현체 - 개발자 D 담당
 *
 * AI 분석 처리 전에 수행할 작업들을 구현합니다.
 * 주로 캐시 조회를 통한 빠른 응답 제공을 담당합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PreProcessingUseCaseImpl implements PreProcessingUseCase {

    private final SessionFilterService sessionFilterService;

    @Override
    public Optional<ProcessingResult> executePreProcessing(ProcessingRequest request) {
        log.info("처리 전 준비 작업 시작 - 요청 ID: {}", request.getRequestId());

        // TODO: 개발자 D가 캐시 조회 로직 구현
        // 현재는 캐시 미스로 처리
        return Optional.empty();
    }

    @Override
    public boolean validateRequest(ProcessingRequest request) {
        log.debug("요청 유효성 검증 - 요청 ID: {}", request.getRequestId());

        // TODO: 개발자 D가 요청 검증 로직 구현
        // 기본적인 null 체크만 수행
        return request != null && request.getRequestId() != null;
    }

    @Override
    public String generateCacheKey(ProcessingRequest request) {
        log.debug("캐시 키 생성 - 요청 ID: {}", request.getRequestId());

        // TODO: 개발자 D가 캐시 키 생성 로직 구현
        // 임시로 요청 ID 반환
        return request.getRequestId();
    }

    @Override
    public void collectPreProcessingMetrics(ProcessingRequest request, boolean cacheHit) {
        log.debug("처리 전 메트릭 수집 - 요청 ID: {}, 캐시 히트: {}",
            request.getRequestId(), cacheHit);

        // TODO: 개발자 D가 메트릭 수집 로직 구현
    }

    @Override
    public UserSettings getUserSettings(String sessionId) {
        log.debug("사용자 설정 조회 - sessionId: {}", sessionId);

        try {
            // 이미지 및 텍스트 필터 설정 모두 조회
            ImageFilterSettings imageSettings = sessionFilterService.getImageFilterSettings(sessionId);
            TextFilterSettings textSettings = sessionFilterService.getTextFilterSettings(sessionId);

            log.debug("Raw 설정 조회 결과 - sessionId: {}, imageSettings: {}, textSettings: {}",
                sessionId, imageSettings, textSettings);

            // 빈 설정이 아닌 유효한 설정이 있는지 확인
            boolean hasValidImageSettings = imageSettings != null && !imageSettings.getEnabledFilters().isEmpty();
            boolean hasValidTextSettings = textSettings != null && !textSettings.getEnabledFilters().isEmpty();

            if (hasValidImageSettings || hasValidTextSettings) {
                UserSettings.UserSettingsBuilder builder = UserSettings.builder()
                    .sessionId(sessionId);

                // 이미지 설정 추가 (유효한 설정만)
                if (hasValidImageSettings) {
                    builder.imageFilterSettings(UserSettings.ImageFilterSettings.builder()
                        .enabled(true)
                        .enabledCategories(imageSettings.getEnabledFilters().stream()
                            .map(Enum::name)
                            .toList())
                        .build());
                }

                // 텍스트 설정 추가 (유효한 설정만)
                if (hasValidTextSettings) {
                    builder.textFilterSettings(UserSettings.TextFilterSettings.builder()
                        .enabled(true)
                        .enabledCategories(textSettings.getEnabledFilters().stream()
                            .map(Enum::name)
                            .toList())
                        .build());
                }

                UserSettings userSettings = builder.build();
                log.debug("사용자 설정 조회 완료 - sessionId: {}, hasValidImageSettings: {}, hasValidTextSettings: {}",
                    sessionId, hasValidImageSettings, hasValidTextSettings);
                return userSettings;
            }
        } catch (Exception e) {
            log.warn("사용자 설정 조회 실패 - sessionId: {}, error: {}", sessionId, e.getMessage());
        }

        log.debug("사용자 설정 없음 - sessionId: {}", sessionId);
        return null;
    }
}