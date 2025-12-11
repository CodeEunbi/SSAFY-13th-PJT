package backend.SSAFY_PTJ2.infrastructure.cache;

import backend.SSAFY_PTJ2.domain.common.dto.UserSettings;
import backend.SSAFY_PTJ2.domain.common.dto.UserSettingsDto;
import backend.SSAFY_PTJ2.domain.common.service.UserSettingsService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import backend.SSAFY_PTJ2.domain.imagefilter.ImageLabels;
import backend.SSAFY_PTJ2.domain.textfilter.TextLabels;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Redis 기반 사용자 설정 서비스 구현체 - 개발자 A 담당
 *
 * Socket.IO user-settings 이벤트로 받은 UserSettingsDto를 Redis에 저장하고,
 * AI 분석 시 사용자 설정을 조회하여 필터링에 활용합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisUserSettingsService implements UserSettingsService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String USER_SETTINGS_KEY_PREFIX = "user:settings:";
    private static final String STATISTICS_KEY = "user:settings:stats";
    private static final long DEFAULT_TTL_HOURS = 24; // 24시간 TTL

    @Override
    public UserSettings getUserSettings(String sessionId) {
        log.debug("사용자 설정 조회 시도 - sessionId: {}", sessionId);

        try {
            String key = USER_SETTINGS_KEY_PREFIX + sessionId;
            Object rawSettings = redisTemplate.opsForValue().get(key);

            if (rawSettings == null) {
                log.debug("사용자 설정 없음, 기본 설정 반환 - sessionId: {}", sessionId);
                return getDefaultSettings();
            }

            // Redis에서 가져온 데이터를 UserSettings로 변환
            UserSettings userSettings = convertToUserSettings(rawSettings, sessionId);
            log.debug("사용자 설정 조회 성공 - sessionId: {}", sessionId);
            return userSettings;

        } catch (Exception e) {
            log.error("사용자 설정 조회 실패 - sessionId: {}, error: {}", sessionId, e.getMessage(), e);
            return getDefaultSettings();
        }
    }

    @Override
    public void saveUserSettings(UserSettings userSettings) {
        log.debug("사용자 설정 저장 시도 - sessionId: {}", userSettings.getSessionId());

        try {
            String key = USER_SETTINGS_KEY_PREFIX + userSettings.getSessionId();

            // UserSettings를 JSON으로 직렬화하여 저장
            String jsonSettings = objectMapper.writeValueAsString(userSettings);
            redisTemplate.opsForValue().set(key, jsonSettings, DEFAULT_TTL_HOURS, TimeUnit.HOURS);

            // 통계 업데이트
            updateStatistics(userSettings);

            log.info("사용자 설정 저장 완료 - sessionId: {}", userSettings.getSessionId());

        } catch (JsonProcessingException e) {
            log.error("사용자 설정 직렬화 실패 - sessionId: {}, error: {}",
                userSettings.getSessionId(), e.getMessage(), e);
            throw new RuntimeException("사용자 설정 저장 실패", e);
        } catch (Exception e) {
            log.error("사용자 설정 저장 실패 - sessionId: {}, error: {}",
                userSettings.getSessionId(), e.getMessage(), e);
            throw new RuntimeException("사용자 설정 저장 실패", e);
        }
    }

    /**
     * UserSettingsDto를 UserSettings로 변환하여 저장
     */
    public void saveUserSettingsFromDto(String sessionId, UserSettingsDto userSettingsDto) {
        log.debug("UserSettingsDto를 UserSettings로 변환 후 저장 - sessionId: {}", sessionId);

        UserSettings userSettings = convertFromDto(sessionId, userSettingsDto);
        saveUserSettings(userSettings);
    }

    @Override
    public void deleteUserSettings(String sessionId) {
        log.debug("사용자 설정 삭제 시도 - sessionId: {}", sessionId);

        try {
            String key = USER_SETTINGS_KEY_PREFIX + sessionId;
            Boolean deleted = redisTemplate.delete(key);

            if (Boolean.TRUE.equals(deleted)) {
                log.info("사용자 설정 삭제 완료 - sessionId: {}", sessionId);
            } else {
                log.warn("삭제할 사용자 설정이 없음 - sessionId: {}", sessionId);
            }

        } catch (Exception e) {
            log.error("사용자 설정 삭제 실패 - sessionId: {}, error: {}", sessionId, e.getMessage(), e);
            throw new RuntimeException("사용자 설정 삭제 실패", e);
        }
    }

    @Override
    public UserSettings getDefaultSettings() {
        return UserSettings.builder()
            .sessionId("default")
            .textFilterSettings(UserSettings.TextFilterSettings.builder()
                .enabled(true)
                .sensitivityLevel(0.5)
                .enabledCategories(Arrays.asList("POLITICS")) // 기본적으로 정치 카테고리만 활성화
                .showWarningMessage(true)
                .replacementText("**필터링된 내용**")
                .build())
            .imageFilterSettings(UserSettings.ImageFilterSettings.builder()
                .enabled(true)
                .sensitivityLevel(0.5)
                .enabledCategories(Arrays.asList("CRIME", "HORROR")) // 기본적으로 범죄, 공포 카테고리 활성화
                .blurInsteadOfHide(true)
                .overlayMessage("민감한 이미지가 필터링되었습니다.")
                .build())
            .notificationSettings(UserSettings.NotificationSettings.builder()
                .showFilterCount(true)
                .soundAlert(false)
                .desktopNotification(false)
                .build())
            .version(1)
            .additionalSettings(new HashMap<>())
            .build();
    }

    @Override
    public boolean validateSettings(UserSettings userSettings) {
        if (userSettings == null || userSettings.getSessionId() == null || userSettings.getSessionId().isEmpty()) {
            return false;
        }

        // 텍스트 필터 설정 검증
        if (userSettings.getTextFilterSettings() != null) {
            UserSettings.TextFilterSettings textSettings = userSettings.getTextFilterSettings();
            if (textSettings.getSensitivityLevel() < 0.0 || textSettings.getSensitivityLevel() > 1.0) {
                return false;
            }
        }

        // 이미지 필터 설정 검증
        if (userSettings.getImageFilterSettings() != null) {
            UserSettings.ImageFilterSettings imageSettings = userSettings.getImageFilterSettings();
            if (imageSettings.getSensitivityLevel() < 0.0 || imageSettings.getSensitivityLevel() > 1.0) {
                return false;
            }
        }

        return true;
    }

    @Override
    public SettingsStatistics getSettingsStatistics() {
        try {
            Object statsData = redisTemplate.opsForValue().get(STATISTICS_KEY);
            if (statsData != null) {
                return objectMapper.readValue(statsData.toString(), SettingsStatistics.class);
            }
        } catch (Exception e) {
            log.error("통계 조회 실패: {}", e.getMessage(), e);
        }

        // 기본 통계 반환
        return new SettingsStatistics(0L, 0.0, 0.0, 0.5);
    }

    /**
     * UserSettingsDto를 UserSettings로 변환
     */
    private UserSettings convertFromDto(String sessionId, UserSettingsDto dto) {
        UserSettingsDto.Settings dtoSettings = dto.getSettings();

        // 텍스트 필터 카테고리 변환
        List<String> textCategories = dtoSettings.getFilterText() != null && dtoSettings.getFilterText().isEnabled()
            ? dtoSettings.getFilterText().getCategories().stream()
            .map(TextLabels::name)
            .collect(Collectors.toList())
            : Collections.emptyList();

        // 이미지 필터 카테고리 변환
        List<String> imageCategories = dtoSettings.getFilterImage() != null && dtoSettings.getFilterImage().isEnabled()
            ? dtoSettings.getFilterImage().getCategories().stream()
            .map(ImageLabels::name)
            .collect(Collectors.toList())
            : Collections.emptyList();

        return UserSettings.builder()
            .sessionId(sessionId)
            .textFilterSettings(UserSettings.TextFilterSettings.builder()
                .enabled(dtoSettings.isFilteringEnabled() && dtoSettings.getFilterText() != null && dtoSettings.getFilterText().isEnabled())
                .sensitivityLevel(0.5) // 기본값, 필요시 DTO에 추가
                .enabledCategories(textCategories)
                .showWarningMessage(dtoSettings.getFilterText() != null && dtoSettings.getFilterText().isOriginalViewEnabled())
                .replacementText("**필터링된 내용**")
                .build())
            .imageFilterSettings(UserSettings.ImageFilterSettings.builder()
                .enabled(dtoSettings.isFilteringEnabled() && dtoSettings.getFilterImage() != null && dtoSettings.getFilterImage().isEnabled())
                .sensitivityLevel(0.5) // 기본값, 필요시 DTO에 추가
                .enabledCategories(imageCategories)
                .blurInsteadOfHide(true)
                .overlayMessage("민감한 이미지가 필터링되었습니다.")
                .build())
            .notificationSettings(UserSettings.NotificationSettings.builder()
                .showFilterCount(dtoSettings.isShowIcon())
                .soundAlert(false)
                .desktopNotification(false)
                .build())
            .version(1)
            .additionalSettings(new HashMap<>())
            .build();
    }

    /**
     * Redis 데이터를 UserSettings로 변환
     */
    private UserSettings convertToUserSettings(Object rawSettings, String sessionId) {
        try {
            if (rawSettings instanceof String) {
                return objectMapper.readValue((String) rawSettings, UserSettings.class);
            } else {
                // 이미 객체로 역직렬화된 경우
                String jsonString = objectMapper.writeValueAsString(rawSettings);
                return objectMapper.readValue(jsonString, UserSettings.class);
            }
        } catch (Exception e) {
            log.error("UserSettings 변환 실패 - sessionId: {}, error: {}", sessionId, e.getMessage(), e);
            return getDefaultSettings();
        }
    }

    /**
     * 통계 업데이트
     */
    private void updateStatistics(UserSettings userSettings) {
        try {
            // 간단한 통계 업데이트 로직
            // 실제 구현에서는 더 정교한 통계 관리가 필요할 수 있음
            redisTemplate.opsForHash().increment(STATISTICS_KEY, "totalUsers", 1);

            if (userSettings.getTextFilterSettings() != null && userSettings.getTextFilterSettings().isEnabled()) {
                redisTemplate.opsForHash().increment(STATISTICS_KEY, "textFilterEnabledUsers", 1);
            }

            if (userSettings.getImageFilterSettings() != null && userSettings.getImageFilterSettings().isEnabled()) {
                redisTemplate.opsForHash().increment(STATISTICS_KEY, "imageFilterEnabledUsers", 1);
            }

        } catch (Exception e) {
            log.warn("통계 업데이트 실패: {}", e.getMessage());
        }
    }

    /**
     * AI 분석 요청에 사용할 텍스트 필터 카테고리 맵 생성
     */
    public Map<String, Boolean> getTextFilterCategoryMap(String sessionId) {
        UserSettings settings = getUserSettings(sessionId);
        Map<String, Boolean> categoryMap = new HashMap<>();

        // 기본값 설정 (모든 카테고리 비활성화)
        categoryMap.put("IN", false); // 욕설/모독
        categoryMap.put("VI", false); // 폭력/혐오
        categoryMap.put("PO", false); // 정치
        categoryMap.put("AD", false); // 광고/스팸
        categoryMap.put("SE", false); // 성적 콘텐츠

        if (settings.getTextFilterSettings() != null && settings.getTextFilterSettings().isEnabled()) {
            List<String> enabledCategories = settings.getTextFilterSettings().getEnabledCategories();
            if (enabledCategories != null) {
                for (String category : enabledCategories) {
                    switch (category.toLowerCase()) {
                        case "politics" -> categoryMap.put("PO", true);
                        case "insult" -> categoryMap.put("IN", true);
                        case "violence" -> categoryMap.put("VI", true);
                        case "adult" -> categoryMap.put("AD", true);
                        case "sexual" -> categoryMap.put("SE", true);
                    }
                }
            }
        }

        return categoryMap;
    }

    /**
     * AI 분석 요청에 사용할 이미지 필터 카테고리 리스트 생성
     */
    public List<String> getImageFilterCategories(String sessionId) {
        UserSettings settings = getUserSettings(sessionId);

        if (settings.getImageFilterSettings() != null &&
            settings.getImageFilterSettings().isEnabled() &&
            settings.getImageFilterSettings().getEnabledCategories() != null) {

            return new ArrayList<>(settings.getImageFilterSettings().getEnabledCategories());
        }

        return Collections.emptyList();
    }
}