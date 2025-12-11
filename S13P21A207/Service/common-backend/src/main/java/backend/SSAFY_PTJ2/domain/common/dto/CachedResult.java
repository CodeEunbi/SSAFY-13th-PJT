package backend.SSAFY_PTJ2.domain.common.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Redis 캐시 저장용 결과 DTO
 * AI 분석 결과를 캐시에 저장할 때 사용하는 구조
 */
@Getter
@Builder
public class CachedResult {

    /**
     * 캐시 키 (컨텐츠 해시값 기반)
     */
    private final String cacheKey;

    /**
     * AI 분석 결과
     */
    private final AnalysisResult analysisResult;

    /**
     * 캐시 생성 시간
     */
    private final LocalDateTime cachedAt;

    /**
     * 캐시 만료 시간 (TTL 계산용)
     */
    private final LocalDateTime expiresAt;

    /**
     * 캐시 히트 횟수 (통계용)
     */
    private final int hitCount;

    /**
     * 분석에 사용된 AI 모델 버전
     * (모델 업데이트 시 캐시 무효화 판단용)
     */
    private final String modelVersion;

    /**
     * 캐시 유효성 검증
     * @return 캐시가 아직 유효한지 여부
     */
    public boolean isValid() {
        return LocalDateTime.now().isBefore(expiresAt);
    }

    /**
     * 캐시 키 생성을 위한 헬퍼 메서드
     * @param content 분석할 컨텐츠
     * @param type 요청 타입
     * @return 생성된 캐시 키
     */
    public static String generateCacheKey(String content, ProcessingRequest.RequestType type) {
        // TODO: 개발자 A가 구체적인 캐시 키 생성 로직 구현
        // 예: SHA256 해시 + 타입 prefix
        return type.name().toLowerCase() + ":" + content.hashCode();
    }
}