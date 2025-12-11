package backend.SSAFY_PTJ2.application.usecase;

import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingResult;
import backend.SSAFY_PTJ2.domain.common.dto.UserSettings;

/**
 * 처리 후 유즈케이스 인터페이스 - 개발자 D 담당
 *
 * AI 분석 완료 후 수행할 작업들을 정의합니다.
 * 캐시 저장, 개인 설정 적용, 응답 변환 등을 담당합니다.
 */
public interface PostProcessingUseCase {

    /**
     * 처리 후 작업 실행
     * AI 분석 결과를 받아 후처리를 수행하고 최종 응답을 생성합니다.
     *
     * @param originalRequest 원본 요청
     * @param analysisResult AI 분석 결과
     * @param actualProcessingTimeMs 실제 AI 분석 처리 시간 (ms)
     * @return 최종 처리 결과
     */
    ProcessingResult executePostProcessing(ProcessingRequest originalRequest, AnalysisResult analysisResult, long actualProcessingTimeMs);

    /**
     * 캐시 저장
     * AI 분석 결과를 향후 사용을 위해 캐시에 저장합니다.
     *
     * @param cacheKey 캐시 키
     * @param analysisResult 저장할 분석 결과
     */
    void cacheAnalysisResult(String cacheKey, AnalysisResult analysisResult);

    /**
     * 개인 설정 기반 후처리
     * 사용자의 개인 설정에 따라 분석 결과를 조정합니다.
     *
     * @param analysisResult 원본 분석 결과
     * @param userSettings 사용자 설정
     * @return 개인 설정이 적용된 분석 결과
     */
    AnalysisResult applyUserSettings(AnalysisResult analysisResult, UserSettings userSettings);

    /**
     * 응답 DTO 변환
     * 내부 분석 결과를 클라이언트 응답 형식으로 변환합니다.
     *
     * @param originalRequest 원본 요청
     * @param analysisResult 분석 결과
     * @param processingTimeMs 처리 소요 시간
     * @param fromCache 캐시에서 조회된 결과인지 여부
     * @return 클라이언트 응답용 처리 결과
     */
    ProcessingResult convertToResponse(
        ProcessingRequest originalRequest,
        AnalysisResult analysisResult,
        long processingTimeMs,
        boolean fromCache
    );

    /**
     * 처리 후 메트릭 수집
     * 처리 완료 후 성능, 정확도 등의 메트릭을 수집합니다.
     *
     * @param originalRequest 원본 요청
     * @param processingResult 처리 결과
     * @param processingTimeMs 처리 소요 시간
     */
    void collectPostProcessingMetrics(
        ProcessingRequest originalRequest,
        ProcessingResult processingResult,
        long processingTimeMs
    );
}