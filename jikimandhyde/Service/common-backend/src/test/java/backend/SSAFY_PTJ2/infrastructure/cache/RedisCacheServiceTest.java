//package backend.SSAFY_PTJ2.infrastructure.cache;
//
//import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
//import backend.SSAFY_PTJ2.domain.common.dto.CachedResult;
//import backend.SSAFY_PTJ2.domain.common.service.CacheService;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.test.context.TestPropertySource;
//import org.testcontainers.containers.GenericContainer;
//import org.testcontainers.junit.jupiter.Container;
//import org.testcontainers.junit.jupiter.Testcontainers;
//
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.Optional;
//
//import static org.assertj.core.api.Assertions.assertThat;
//
///**
// * Redis 캐시 서비스 테스트 - 개발자 A 담당
// *
// * TestContainers를 사용한 실제 Redis 통합 테스트
// * 개발자 A는 이 기본 구조를 참고하여 더 많은 테스트 케이스를 추가하세요.
// */
//@SpringBootTest
//@Testcontainers
//@TestPropertySource(properties = {
//    "spring.redis.host=localhost",
//    "spring.redis.port=16379"  // TestContainers에서 매핑된 포트
//})
//class RedisCacheServiceTest {
//
//    @Container
//    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
//            .withExposedPorts(6379)
//            .withReuse(true);
//
//    private CacheService cacheService;
//
//    @BeforeEach
//    void setUp() {
//        // TODO: 개발자 A가 실제 Redis 연결 설정 추가
//        // redis.getMappedPort(6379)를 사용하여 포트 설정
//
//        cacheService = new RedisCacheService(/* Redis 의존성 추가 */);
//    }
//
//    @Test
//    void 캐시_저장_및_조회_성공_테스트() {
//        // Given
//        String cacheKey = "test:image:hash123";
//        CachedResult cachedResult = CachedResult.builder()
//            .cacheKey(cacheKey)
//            .analysisResult(createTestAnalysisResult())
//            .cachedAt(LocalDateTime.now())
//            .expiresAt(LocalDateTime.now().plusHours(1))
//            .hitCount(0)
//            .modelVersion("v1.0")
//            .build();
//
//        // When
//        cacheService.put(cacheKey, cachedResult, 60);
//        Optional<CachedResult> retrieved = cacheService.get(cacheKey);
//
//        // Then
//        assertThat(retrieved).isPresent();
//        assertThat(retrieved.get().getCacheKey()).isEqualTo(cacheKey);
//        assertThat(retrieved.get().getAnalysisResult().isSuccess()).isTrue();
//    }
//
//    @Test
//    void 존재하지_않는_캐시_조회_테스트() {
//        // Given
//        String nonExistentKey = "test:nonexistent:key";
//
//        // When
//        Optional<CachedResult> result = cacheService.get(nonExistentKey);
//
//        // Then
//        assertThat(result).isEmpty();
//    }
//
//    @Test
//    void 캐시_삭제_테스트() {
//        // Given
//        String cacheKey = "test:delete:key";
//        CachedResult cachedResult = createTestCachedResult(cacheKey);
//        cacheService.put(cacheKey, cachedResult, 60);
//
//        // When
//        cacheService.delete(cacheKey);
//        Optional<CachedResult> result = cacheService.get(cacheKey);
//
//        // Then
//        assertThat(result).isEmpty();
//    }
//
//    @Test
//    void 캐시_통계_조회_테스트() {
//        // When
//        CacheService.CacheStatistics statistics = cacheService.getStatistics();
//
//        // Then
//        assertThat(statistics).isNotNull();
//        assertThat(statistics.totalKeys()).isGreaterThanOrEqualTo(0);
//        assertThat(statistics.hitRatio()).isBetween(0.0, 1.0);
//    }
//
//    // TODO: 개발자 A가 추가할 테스트 케이스들:
//    // - TTL 만료 테스트
//    // - 대용량 데이터 캐싱 테스트
//    // - 동시성 테스트 (여러 스레드에서 동시 접근)
//    // - Redis 연결 실패 시 fallback 테스트
//    // - 캐시 키 충돌 테스트
//
//    /**
//     * 테스트용 AnalysisResult 생성 헬퍼 메서드
//     */
//    private AnalysisResult createTestAnalysisResult() {
//        return AnalysisResult.builder()
//            .success(true)
//            .isHateful(false)
//            .confidenceScore(0.85)
//            .detectedCategories(List.of())
//            .hatefulRanges(List.of())
//            .hatefulRegions(List.of())
//            .build();
//    }
//
//    /**
//     * 테스트용 CachedResult 생성 헬퍼 메서드
//     */
//    private CachedResult createTestCachedResult(String cacheKey) {
//        return CachedResult.builder()
//            .cacheKey(cacheKey)
//            .analysisResult(createTestAnalysisResult())
//            .cachedAt(LocalDateTime.now())
//            .expiresAt(LocalDateTime.now().plusHours(1))
//            .hitCount(0)
//            .modelVersion("v1.0")
//            .build();
//    }
//}