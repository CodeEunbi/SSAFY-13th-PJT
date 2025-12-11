package backend.SSAFY_PTJ2.infrastructure.cache;

import backend.SSAFY_PTJ2.domain.common.dto.CachedResult;
import backend.SSAFY_PTJ2.domain.common.service.CacheService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Redis 기반 캐시 서비스 구현체 - 개발자 A 담당
 *
 * TODO 개발자 A 구현 사항:
 * 1. Redis 연결 설정 및 RedisTemplate 구성
 * 2. 캐시 키 네이밍 전략 구현
 * 3. TTL 관리 및 만료 정책 구현
 * 4. 캐시 통계 수집 기능 구현
 * 5. 에러 처리 및 fallback 로직 구현
 */
@Deprecated // 이 로직은 ``
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisCacheService implements CacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    // 캐시 통계를 위한 카운터
    private final AtomicLong hitCount = new AtomicLong(0);
    private final AtomicLong missCount = new AtomicLong(0);

    private static final String CACHE_STATISTICS_KEY = "cache:statistics";

    @Override
    public Optional<CachedResult> get(String cacheKey) {
        log.debug("캐시 조회 시도 - 키: {}", cacheKey);

        try {
            Object rawData = redisTemplate.opsForValue().get(cacheKey);

            if (rawData == null) {
                log.debug("캐시 미스 - 키: {}", cacheKey);
                missCount.incrementAndGet();
                return Optional.empty();
            }

            // JSON 문자열을 CachedResult로 역직렬화
            CachedResult cachedResult;
            if (rawData instanceof String) {
                cachedResult = objectMapper.readValue((String) rawData, CachedResult.class);
            } else {
                // 이미 객체로 역직렬화된 경우
                String jsonString = objectMapper.writeValueAsString(rawData);
                cachedResult = objectMapper.readValue(jsonString, CachedResult.class);
            }

            // TTL 체크
            if (!cachedResult.isValid()) {
                log.debug("캐시 만료됨, 삭제 - 키: {}", cacheKey);
                redisTemplate.delete(cacheKey);
                missCount.incrementAndGet();
                return Optional.empty();
            }

            log.debug("캐시 히트 - 키: {}", cacheKey);
            hitCount.incrementAndGet();
            return Optional.of(cachedResult);

        } catch (JsonProcessingException e) {
            log.error("캐시 데이터 역직렬화 실패 - 키: {}, error: {}", cacheKey, e.getMessage(), e);
            missCount.incrementAndGet();
            return Optional.empty();
        } catch (Exception e) {
            log.error("캐시 조회 실패 - 키: {}, error: {}", cacheKey, e.getMessage(), e);
            missCount.incrementAndGet();
            return Optional.empty();
        }
    }

    @Override
    public void put(String cacheKey, CachedResult result, int ttlMinutes) {
        log.debug("캐시 저장 - 키: {}, TTL: {}분", cacheKey, ttlMinutes);

        try {
            // CachedResult를 JSON으로 직렬화
            String jsonData = objectMapper.writeValueAsString(result);

            // Redis에 TTL과 함께 저장
            redisTemplate.opsForValue().set(cacheKey, jsonData, ttlMinutes, TimeUnit.MINUTES);

            // 통계 업데이트
            updateCacheStatistics("put", 1);

            log.debug("캐시 저장 완료 - 키: {}", cacheKey);

        } catch (JsonProcessingException e) {
            log.error("캐시 데이터 직렬화 실패 - 키: {}, error: {}", cacheKey, e.getMessage(), e);
            // 캐시 실패는 치명적이지 않으므로 예외를 던지지 않음
        } catch (Exception e) {
            log.error("캐시 저장 실패 - 키: {}, error: {}", cacheKey, e.getMessage(), e);
            // 캐시 실패는 치명적이지 않으므로 예외를 던지지 않음
        }
    }

    @Override
    public void delete(String cacheKey) {
        log.debug("캐시 삭제 - 키: {}", cacheKey);

        try {
            Boolean deleted = redisTemplate.delete(cacheKey);

            if (Boolean.TRUE.equals(deleted)) {
                log.debug("캐시 삭제 완료 - 키: {}", cacheKey);
                updateCacheStatistics("delete", 1);
            } else {
                log.debug("삭제할 캐시 키 없음 - 키: {}", cacheKey);
            }

        } catch (Exception e) {
            log.error("캐시 삭제 실패 - 키: {}, error: {}", cacheKey, e.getMessage(), e);
        }
    }

    @Override
    public CacheStatistics getStatistics() {
        log.debug("캐시 통계 조회");

        try {
            // 애플리케이션 레벨 통계
            long hits = hitCount.get();
            long misses = missCount.get();
            long total = hits + misses;
            double hitRatio = total > 0 ? (double) hits / total : 0.0;

            // Redis에서 총 키 수 조회
            Long totalKeys = getTotalCacheKeys();

            return new CacheStatistics(totalKeys != null ? totalKeys : 0L, hits, misses, hitRatio);

        } catch (Exception e) {
            log.error("캐시 통계 조회 실패: {}", e.getMessage(), e);
            return new CacheStatistics(0L, 0L, 0L, 0.0);
        }
    }

    /**
     * 캐시 통계 업데이트
     */
    private void updateCacheStatistics(String operation, long count) {
        try {
            redisTemplate.opsForHash().increment(CACHE_STATISTICS_KEY, operation, count);
            redisTemplate.opsForHash().put(CACHE_STATISTICS_KEY, "lastUpdated", LocalDateTime.now().toString());
        } catch (Exception e) {
            log.warn("캐시 통계 업데이트 실패: {}", e.getMessage());
        }
    }

    /**
     * Redis에서 총 캐시 키 수 조회
     */
    private Long getTotalCacheKeys() {
        try {
            // 캐시 키 패턴으로 키 수 조회 (image:*, text:*)
            Long imageKeys = redisTemplate.countExistingKeys(redisTemplate.keys("image:*"));
            Long textKeys = redisTemplate.countExistingKeys(redisTemplate.keys("text:*"));
            return (imageKeys != null ? imageKeys : 0L) + (textKeys != null ? textKeys : 0L);
        } catch (Exception e) {
            log.warn("총 캐시 키 수 조회 실패: {}", e.getMessage());
            return 0L;
        }
    }
}