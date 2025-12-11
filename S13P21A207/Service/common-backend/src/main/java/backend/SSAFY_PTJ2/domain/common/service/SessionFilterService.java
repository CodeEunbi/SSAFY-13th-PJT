package backend.SSAFY_PTJ2.domain.common.service;

import backend.SSAFY_PTJ2.domain.imagefilter.ImageLabels;
import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageFilterSettings;
import backend.SSAFY_PTJ2.domain.textfilter.TextLabels;
import backend.SSAFY_PTJ2.domain.textfilter.dto.TextFilterSettings;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class  SessionFilterService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${filter.use-redis:true}")
    private boolean useRedis;

    @Value("${filter.session-ttl-hours:24}")
    private long sessionTtlHours;

    // Redis 비활성화 시 사용
    private final Map<String, Object> localCache = new ConcurrentHashMap<>();

    // 키 구분 접두사
    private static final String IMAGE_FILTER_KEY_PREFIX = "filter:image:";
    private static final String TEXT_FILTER_KEY_PREFIX = "filter:text:";

    // ==================== 이미지 필터 ====================

    public void saveImageFilterSettings(String sessionId, Set<ImageLabels> enabledFilters, boolean originalViewEnabled) {
        ImageFilterSettings settings = new ImageFilterSettings(sessionId, enabledFilters, originalViewEnabled);

        if (useRedis) {
            try {
                String key = IMAGE_FILTER_KEY_PREFIX + sessionId;
                redisTemplate.opsForValue().set(key, settings, sessionTtlHours, TimeUnit.HOURS);
                log.info("[Redis] Saved image filter for session {}: filters={}, originalView={}",
                        sessionId, enabledFilters, originalViewEnabled);
            } catch (Exception e) {
                log.error("[Redis] Failed, using local cache", e);
                localCache.put(IMAGE_FILTER_KEY_PREFIX + sessionId, settings);
            }
        } else {
            localCache.put(IMAGE_FILTER_KEY_PREFIX + sessionId, settings);
            log.info("[Local] Saved image filter for session {}: filters={}, originalView={}",
                    sessionId, enabledFilters, originalViewEnabled);
        }
    }

    public ImageFilterSettings getImageFilterSettings(String sessionId) {
        if (useRedis) {
            try {
                String key = IMAGE_FILTER_KEY_PREFIX + sessionId;
                Object value = redisTemplate.opsForValue().get(key);

                if (value instanceof ImageFilterSettings) {
                    return (ImageFilterSettings) value;
                }
            } catch (Exception e) {
                log.error("[Redis] Failed to get, using local", e);
            }
        }

        Object localValue = localCache.get(IMAGE_FILTER_KEY_PREFIX + sessionId);
        if (localValue instanceof ImageFilterSettings) {
            return (ImageFilterSettings) localValue;
        }
        return new ImageFilterSettings(sessionId, Set.of(), false);
    }

    public void deleteImageFilterSettings(String sessionId) {
        if (useRedis) {
            try {
                redisTemplate.delete(IMAGE_FILTER_KEY_PREFIX + sessionId);
                log.info("[Redis] Deleted image filter for session {}", sessionId);
            } catch (Exception e) {
                log.error("[Redis] Failed to delete", e);
            }
        }
        localCache.remove(IMAGE_FILTER_KEY_PREFIX + sessionId);
    }

    // ==================== 텍스트 필터 ====================

    public void saveTextFilterSettings(String sessionId, Set<TextLabels> enabledFilters, boolean originalViewEnabled) {
        TextFilterSettings settings = new TextFilterSettings(sessionId, enabledFilters, originalViewEnabled);

        if (useRedis) {
            try {
                String key = TEXT_FILTER_KEY_PREFIX + sessionId;
                redisTemplate.opsForValue().set(key, settings, sessionTtlHours, TimeUnit.HOURS);
                log.info("[Redis] Saved text filter for session {}: filters={}, originalView={}",
                        sessionId, enabledFilters, originalViewEnabled);
            } catch (Exception e) {
                log.error("[Redis] Failed to save text filter, using local cache", e);
                localCache.put(TEXT_FILTER_KEY_PREFIX + sessionId, settings);
            }
        } else {
            localCache.put(TEXT_FILTER_KEY_PREFIX + sessionId, settings);
            log.info("[Local] Saved text filter for session {}: filters={}, originalView={}",
                    sessionId, enabledFilters, originalViewEnabled);
        }
    }

    public TextFilterSettings getTextFilterSettings(String sessionId) {
        if (useRedis) {
            try {
                String key = TEXT_FILTER_KEY_PREFIX + sessionId;
                Object value = redisTemplate.opsForValue().get(key);

                if (value instanceof TextFilterSettings) {
                    return (TextFilterSettings) value;
                }
            } catch (Exception e) {
                log.error("[Redis] Failed to get text filter, using local", e);
            }
        }

        Object localValue = localCache.get(TEXT_FILTER_KEY_PREFIX + sessionId);
        if (localValue instanceof TextFilterSettings) {
            return (TextFilterSettings) localValue;
        }

        return new TextFilterSettings(sessionId, Set.of(), false);
    }

    public void deleteTextFilterSettings(String sessionId) {
        if (useRedis) {
            try {
                redisTemplate.delete(TEXT_FILTER_KEY_PREFIX + sessionId);
                log.info("[Redis] Deleted text filter for session {}", sessionId);
            } catch (Exception e) {
                log.error("[Redis] Failed to delete text filter", e);
            }
        }
        localCache.remove(TEXT_FILTER_KEY_PREFIX + sessionId);
    }
}