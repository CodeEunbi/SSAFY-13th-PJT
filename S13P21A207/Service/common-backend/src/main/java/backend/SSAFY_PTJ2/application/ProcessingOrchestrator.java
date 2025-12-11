package backend.SSAFY_PTJ2.application;

import backend.SSAFY_PTJ2.application.usecase.PostProcessingUseCase;
import backend.SSAFY_PTJ2.application.usecase.PreProcessingUseCase;
import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingResult;
import backend.SSAFY_PTJ2.domain.common.dto.UserSettings;
import backend.SSAFY_PTJ2.domain.common.service.ProcessingScheduler;
import backend.SSAFY_PTJ2.infrastructure.ai.adapter.ImageAIAnalysisClient;
import backend.SSAFY_PTJ2.infrastructure.ai.adapter.TextAIAnalysisClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * 전체 처리 플로우 오케스트레이터 - 개발자 D 담당
 *
 * Socket.IO 핸들러에서 호출되는 메인 엔트리 포인트입니다.
 * 모든 처리 단계를 조율하고 최종 결과를 반환합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProcessingOrchestrator {

    private final PreProcessingUseCase preProcessingUseCase;
    private final PostProcessingUseCase postProcessingUseCase;
    private final ProcessingScheduler processingScheduler;
    private final ImageAIAnalysisClient imageAIAnalysisClient;
    private final TextAIAnalysisClient textAIAnalysisClient;
    /**
     * 동기 처리 메인 플로우
     * Socket.IO 핸들러에서 호출되는 동기 처리 메서드입니다.
     *
     * @param request 처리 요청
     * @return 최종 처리 결과
     */
    public ProcessingResult processSync(ProcessingRequest request) {
        long startTime = System.currentTimeMillis();

        try {
            log.info("동기 처리 시작 - 요청 ID: {}, 타입: {}, 우선순위: {}",
                request.getRequestId(), request.getType(), request.getPriority());

            // 1단계: 처리 전 작업 (캐시 조회)
            Optional<ProcessingResult> cachedResult = preProcessingUseCase.executePreProcessing(request);
            if (cachedResult.isPresent()) {
                log.info("캐시 히트 - 요청 ID: {}", request.getRequestId());
                return cachedResult.get();
            }

            // 2단계: 요청 타입에 따른 분기 처리
            ProcessingResult result = switch (request.getType()) {
                case IMAGE_ANALYSIS -> processImageRequest(request);
                case TEXT_ANALYSIS -> processTextRequest(request);
            };

            long processingTime = System.currentTimeMillis() - startTime;
            log.info("동기 처리 완료 - 요청 ID: {}, 소요시간: {}ms",
                request.getRequestId(), processingTime);

            return result;

        } catch (ProcessingScheduler.ProcessingException e) {
            log.error("처리 중 오류 발생 - 요청 ID: {}, 오류: {}",
                request.getRequestId(), e.getMessage(), e);
            return createErrorResult(request, e);
        } catch (Exception e) {
            log.error("예상치 못한 오류 발생 - 요청 ID: {}",
                request.getRequestId(), e);
            return createErrorResult(request, e);
        }
    }

    /**
     * 에러 결과 생성
     * 처리 중 발생한 예외를 ProcessingResult로 변환합니다.
     *
     * @param request 원본 요청
     * @param exception 발생한 예외
     * @return 에러 정보가 포함된 처리 결과
     */
    private ProcessingResult createErrorResult(ProcessingRequest request, Exception exception) {
        // TODO: 개발자 D가 구체적인 에러 결과 생성 로직 구현
        return ProcessingResult.builder()
            .requestId(request.getRequestId())
            .success(false)
            .errorInfo(ProcessingResult.ErrorInfo.builder()
                .errorCode("PROCESSING_ERROR")
                .errorMessage(exception.getMessage())
                .category("시스템 오류")
                .build())
            .processingTimeMs(0L)
            .fromCache(false)
            .build();
    }

    /**
     * 이미지 요청 처리 - 자동 전환 로직 적용
     * 스케줄러 상태에 따라 자동으로 처리 방식 결정
     */
    private ProcessingResult processImageRequest(ProcessingRequest request) throws ProcessingScheduler.ProcessingException {
        log.debug("이미지 요청 처리 시작 - 요청 ID: {}", request.getRequestId());

        // 전략 1: 스케줄러 건강성 기반 자동 전환
        if (processingScheduler.isHealthy()) {
            // 스케줄러가 완전히 구현된 상태 - 스케줄러 사용
            log.info("스케줄러 플로우 사용 - 요청 ID: {}", request.getRequestId());
            return processingScheduler.scheduleAndProcess(request);
        } else {
            // 스케줄러 미완성 상태 - 직접 처리 플로우
            log.info("직접 처리 플로우 사용 - 요청 ID: {}", request.getRequestId());
            return processImageDirectly(request);
        }
    }

    /**
     * 이미지 직접 처리 플로우
     * 이미지 분석은 AI 분석 후에 사용자 설정을 적용
     * 추후 스케줄러 완성시 해당 함수는 deprecated될것임
     */
    private ProcessingResult processImageDirectly(ProcessingRequest request) throws ProcessingScheduler.ProcessingException {
        try {
            long startTime = System.currentTimeMillis();

            // 1. AI 분석 먼저 수행
            AnalysisResult analysisResult = imageAIAnalysisClient.analyze(request);

            // 2. 사용자 설정 조회
            UserSettings userSettings = preProcessingUseCase.getUserSettings(request.getSessionId());

            // 3. 사용자 설정 적용
            AnalysisResult filteredResult = postProcessingUseCase.applyUserSettings(analysisResult, userSettings);

            // 4. 결과 변환
            long processingTime = System.currentTimeMillis() - startTime;
            return postProcessingUseCase.convertToResponse(request, filteredResult, processingTime, false);

        } catch (Exception e) {
            log.error("직접 처리 플로우 중 오류 발생 - 요청 ID: {}", request.getRequestId(), e);
            throw new ProcessingScheduler.ProcessingException(
                "직접 처리 플로우 오류: " + e.getMessage(),
                "DIRECT_FLOW_ERROR",
                request.getType(),
                e
            );
        }
    }

    /**
     * 텍스트 요청 처리
     * TODO: 개발자 D 구현
     */
    private ProcessingResult processTextRequest(ProcessingRequest request) throws ProcessingScheduler.ProcessingException {
        log.debug("텍스트 요청 처리 시작 - 요청 ID: {}", request.getRequestId());

        // 전략 1: 스케줄러 건강성 기반 자동 전환
        if (processingScheduler.isHealthy()) {
            // 스케줄러가 완전히 구현된 상태 - 스케줄러 사용
            log.info("스케줄러 플로우 사용 - 요청 ID: {}", request.getRequestId());
            return processingScheduler.scheduleAndProcess(request);
        } else {
            // 스케줄러 미완성 상태 - 직접 처리 플로우
            log.info("직접 처리 플로우 사용 - 요청 ID: {}", request.getRequestId());
            return processTextDirectly(request);
        }
    }
    /**
     * 텍스트 직접 처리 플로우
     * 텍스트 분석은 AI 분석 전에 사용자 설정을 가져와야 함
     * 추후 스케줄러 완성시 해당 함수는 deprecated될것임
     */
    private ProcessingResult processTextDirectly(ProcessingRequest request) throws ProcessingScheduler.ProcessingException {
        try {
            long startTime = System.currentTimeMillis();

            // 1. 사용자 설정 조회 (텍스트는 AI 분석 전에 필요)
            UserSettings userSettings = preProcessingUseCase.getUserSettings(request.getSessionId());

            // 2. 사용자 설정이 포함된 요청으로 AI 분석
            AnalysisResult analysisResult = textAIAnalysisClient.analyze(request, userSettings);

            // 3. 후처리 (결과 변환만)
            long processingTime = System.currentTimeMillis() - startTime;
            return postProcessingUseCase.convertToResponse(request, analysisResult, processingTime, false);

        } catch (Exception e) {
            log.error("직접 처리 플로우 중 오류 발생 - 요청 ID: {}", request.getRequestId(), e);
            throw new ProcessingScheduler.ProcessingException(
                "직접 처리 플로우 오류: " + e.getMessage(),
                "DIRECT_FLOW_ERROR",
                request.getType(),
                e
            );
        }
    }

    /**
     * 처리 상태 확인
     * 전체 시스템의 상태를 확인합니다.
     *
     * @return 시스템 상태 (true: 정상, false: 비정상)
     */
    public boolean isSystemHealthy() {
        // TODO: 개발자 D가 전체 시스템 헬스체크 로직 구현
        return processingScheduler.isHealthy();
    }
}