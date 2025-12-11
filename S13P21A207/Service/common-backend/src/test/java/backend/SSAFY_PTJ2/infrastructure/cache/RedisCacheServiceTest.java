package backend.SSAFY_PTJ2.infrastructure.cache;

import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.common.dto.CachedResult;
import backend.SSAFY_PTJ2.domain.common.service.CacheService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import redis.clients.jedis.JedisPoolConfig;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Redis 캐시 서비스 테스트 - 필수 테스트만 구현
 */
@SpringBootTest
@Testcontainers
class RedisCacheServiceTest {

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.redis.host", redis::getHost);
        registry.add("spring.redis.port", () -> redis.getMappedPort(6379).toString());
    }

    private CacheService cacheService;

    @BeforeEach
    void setUp() {
        // Redis 연결 설정
        JedisConnectionFactory connectionFactory = new JedisConnectionFactory();
        connectionFactory.setHostName(redis.getHost());
        connectionFactory.setPort(redis.getMappedPort(6379));
        connectionFactory.setPoolConfig(new JedisPoolConfig());
        connectionFactory.afterPropertiesSet();

        // RedisTemplate 설정
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(connectionFactory);
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        redisTemplate.afterPropertiesSet();

        // 서비스 초기화
        cacheService = new RedisCacheService(redisTemplate, new ObjectMapper());
    }

    @Test
    void 캐시_저장_및_조회_성공_테스트() {
        // Given
        String cacheKey = "test:image:hash123";
        CachedResult cachedResult = CachedResult.builder()
            .cacheKey(cacheKey)
            .analysisResult(createTestAnalysisResult())
            .cachedAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusHours(1))
            .hitCount(0)
            .modelVersion("v1.0")
            .build();

        // When
        cacheService.put(cacheKey, cachedResult, 60);
        Optional<CachedResult> retrieved = cacheService.get(cacheKey);

        // Then
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getCacheKey()).isEqualTo(cacheKey);
        assertThat(retrieved.get().getAnalysisResult().isSuccess()).isTrue();
    }

    @Test
    void 존재하지_않는_캐시_조회_테스트() {
        // Given
        String nonExistentKey = "test:nonexistent:key";

        // When
        Optional<CachedResult> result = cacheService.get(nonExistentKey);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void 캐시_삭제_테스트() {
        // Given
        String cacheKey = "test:delete:key";
        CachedResult cachedResult = createTestCachedResult(cacheKey);
        cacheService.put(cacheKey, cachedResult, 60);

        // When
        cacheService.delete(cacheKey);
        Optional<CachedResult> result = cacheService.get(cacheKey);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void 캐시_통계_조회_테스트() {
        // When
        CacheService.CacheStatistics statistics = cacheService.getStatistics();

        // Then
        assertThat(statistics).isNotNull();
        assertThat(statistics.totalKeys()).isGreaterThanOrEqualTo(0);
        assertThat(statistics.hitRatio()).isBetween(0.0, 1.0);
    }

    /**
     * 테스트용 AnalysisResult 생성 헬퍼 메서드
     */
    private AnalysisResult createTestAnalysisResult() {
        return AnalysisResult.builder()
            .success(true)
            .isHateful(false)
            .confidenceScore(0.85)
            .detectedCategories(List.of())
            .hatefulRanges(List.of())
            .hatefulRegions(List.of())
            .build();
    }

    /**
     * 테스트용 CachedResult 생성 헬퍼 메서드
     */
    private CachedResult createTestCachedResult(String cacheKey) {
        return CachedResult.builder()
            .cacheKey(cacheKey)
            .analysisResult(createTestAnalysisResult())
            .cachedAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusHours(1))
            .hitCount(0)
            .modelVersion("v1.0")
            .build();
    }
}