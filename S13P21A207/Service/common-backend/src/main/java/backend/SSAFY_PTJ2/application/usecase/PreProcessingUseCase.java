package backend.SSAFY_PTJ2.application.usecase;

import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingResult;
import backend.SSAFY_PTJ2.domain.common.dto.UserSettings;

import java.util.Optional;

/**
 * 처리 전 유즈케이스 인터페이스 - 개발자 D 담당
 *
 * AI 분석 처리 전에 수행할 작업들을 정의합니다.
 * 주로 캐시 조회를 통한 빠른 응답 제공을 담당합니다.
 */
public interface PreProcessingUseCase {

    /**
     * 처리 전 준비 작업 실행
     * 캐시 조회를 통해 이미 분석된 컨텐츠인지 확인합니다.
     *
     * @param request 처리 요청
     * @return 캐시된 결과 (있는 경우), 없으면 Optional.empty()
     */
    Optional<ProcessingResult> executePreProcessing(ProcessingRequest request);

    /**
     * 요청 유효성 검증
     * 요청 데이터가 올바른 형식인지 검증합니다.
     *
     * @param request 검증할 요청
     * @return 검증 결과 (true: 유효, false: 무효)
     */
    boolean validateRequest(ProcessingRequest request);

    /**
     * 캐시 키 생성
     * 컨텐츠와 요청 타입을 기반으로 캐시 키를 생성합니다.
     *
     * @param request 처리 요청
     * @return 생성된 캐시 키
     */
    String generateCacheKey(ProcessingRequest request);

    /**
     * 처리 전 메트릭 수집
     * 요청 분석, 캐시 히트율 등의 메트릭을 수집합니다.
     *
     * @param request 처리 요청
     * @param cacheHit 캐시 히트 여부
     */
    void collectPreProcessingMetrics(ProcessingRequest request, boolean cacheHit);

    /**
     * 사용자 설정 조회
     * 세션 ID를 기반으로 사용자 필터링 설정을 조회합니다.
     * 텍스트 분석에서 AI 요청 전에 사용자 설정이 필요할 때 사용됩니다.
     *
     * @param sessionId 세션 ID
     * @return 사용자 설정 (없으면 null)
     */
    UserSettings getUserSettings(String sessionId);
}