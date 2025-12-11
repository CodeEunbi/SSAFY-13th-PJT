package backend.SSAFY_PTJ2.domain.common.service;

import backend.SSAFY_PTJ2.domain.common.dto.CachedResult;

import java.util.Optional;

/**
 * 캐시 서비스 인터페이스 - 개발자 A 담당
 *
 * Redis를 이용한 AI 분석 결과 캐싱을 담당합니다.
 * 동일한 컨텐츠에 대한 반복 분석을 방지하여 응답 속도를 향상시킵니다.
 */
public interface CacheService {

    /**
     * 캐시에서 분석 결과 조회
     *
     * @param cacheKey 캐시 키 (컨텐츠 해시 기반)
     * @return 캐시된 결과 (없으면 Optional.empty())
     */
    Optional<CachedResult> get(String cacheKey);

    /**
     * 분석 결과를 캐시에 저장
     *
     * @param cacheKey 캐시 키
     * @param result 저장할 분석 결과
     * @param ttlMinutes TTL (Time To Live) 분 단위
     */
    void put(String cacheKey, CachedResult result, int ttlMinutes);

    /**
     * 캐시에서 특정 키 삭제
     *
     * @param cacheKey 삭제할 캐시 키
     */
    void delete(String cacheKey);

    /**
     * 캐시 통계 정보 조회 (모니터링용)
     *
     * @return 캐시 히트율, 총 키 수 등의 통계 정보
     */
    CacheStatistics getStatistics();

    /**
     * 캐시 통계 정보 DTO
     */
    record CacheStatistics(
        long totalKeys,      // 총 캐시 키 수
        long hitCount,       // 캐시 히트 수
        long missCount,      // 캐시 미스 수
        double hitRatio      // 캐시 히트율
    ) {}
}