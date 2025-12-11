package backend.SSAFY_PTJ2.application.scheduler;

import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingResult;
import backend.SSAFY_PTJ2.domain.common.service.AIAnalysisClient;
import backend.SSAFY_PTJ2.domain.common.service.ProcessingScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.PriorityBlockingQueue;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;
import java.util.Comparator;

/**
 * 동기 처리 스케줄러 구현체 - 개발자 C 담당
 *
 * 이미지와 텍스트 AI 컨테이너별로 분리된 우선순위 큐와 락을 관리합니다.
 * - 이미지 분석 AI 컨테이너: imageQueue + imageAILock
 * - 텍스트 분석 AI 컨테이너: textQueue + textAILock
 *
 * 구현 사항:
 * 1. 타입별 분리된 PriorityQueue 관리
 * 2. 뷰포트 컨텐츠 우선순위 알고리즘 구현
 * 3. AI 컨테이너별 독립적인 ReentrantLock 관리
 * 4. 처리 시간 모니터링 및 통계 수집
 * 5. 요청 취소 및 타임아웃 처리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SynchronousProcessingScheduler implements ProcessingScheduler {

    // TODO: 개발자 C가 AI 클라이언트 의존성 추가
    // private final ImageAIClient imageAIClient;
    // private final TextAIClient textAIClient;

    // AI 컨테이너별 분리된 우선순위 큐
    private final PriorityBlockingQueue<ProcessingRequest> imageQueue;
    private final PriorityBlockingQueue<ProcessingRequest> textQueue;

    // AI 컨테이너별 락 (동시 처리 방지)
    private final ReentrantLock imageAILock = new ReentrantLock();
    private final ReentrantLock textAILock = new ReentrantLock();

    // 통계 관리 필드
    private final AtomicLong totalImageRequests = new AtomicLong(0);
    private final AtomicLong totalTextRequests = new AtomicLong(0);
    private final AtomicLong totalImageProcessingTime = new AtomicLong(0);
    private final AtomicLong totalTextProcessingTime = new AtomicLong(0);

    /**
     * 우선순위 비교자: HIGH > NORMAL, 같은 우선순위면 요청 시간 순
     */
    private static final Comparator<ProcessingRequest> PRIORITY_COMPARATOR =
        Comparator.<ProcessingRequest>comparingInt(r -> r.getPriority() == ProcessingRequest.Priority.HIGH ? 0 : 1)
            .thenComparing(ProcessingRequest::getTimestamp);

    public SynchronousProcessingScheduler() {
        this.imageQueue = new PriorityBlockingQueue<>(100, PRIORITY_COMPARATOR);
        this.textQueue = new PriorityBlockingQueue<>(100, PRIORITY_COMPARATOR);
    }

    @Override
    public ProcessingResult scheduleAndProcess(ProcessingRequest request) throws ProcessingException {
        log.info("처리 요청 스케줄링 - 요청 ID: {}, 타입: {}, 우선순위: {}",
            request.getRequestId(), request.getType(), request.getPriority());

        long startTime = System.currentTimeMillis();

        try {
            // 1. 요청을 우선순위 큐에 추가 (실제로는 즉시 처리하지만 향후 확장용)
            enqueueRequest(request);

            // 2. 적절한 AI 클라이언트 선택 및 락 획득
            AIAnalysisClient client = selectAIClient(request.getType());
            ReentrantLock lock = getLockForRequestType(request.getType());

            // 3. 락을 획득하고 AI 분석 수행
            lock.lock();
            try {
                return processWithAI(request, client, startTime);
            } finally {
                lock.unlock();
            }

        } catch (Exception e) {
            long processingTime = System.currentTimeMillis() - startTime;
            log.error("처리 중 오류 발생 - 요청 ID: {}, 소요시간: {}ms",
                request.getRequestId(), processingTime, e);

            throw new ProcessingException(
                "처리 중 오류 발생: " + e.getMessage(),
                "SCHEDULER_ERROR",
                request.getType(),
                e
            );
        }
    }

    @Override
    public CompletableFuture<ProcessingResult> scheduleAndProcessAsync(ProcessingRequest request) {
        // TODO: 개발자 C 구현 (향후 확장용)
        // 비동기 처리가 필요한 경우를 위한 인터페이스

        return CompletableFuture.supplyAsync(() -> {
            try {
                return scheduleAndProcess(request);
            } catch (ProcessingException e) {
                throw new RuntimeException(e);
            }
        });
    }

    @Override
    public QueueStatus getQueueStatus() {
        // TODO: 개발자 C 구현
        // 1. 현재 큐 상태 조회
        // 2. 락 상태 확인
        // 3. 평균 처리 시간 계산

        return new QueueStatus(
            0,      // totalQueueSize
            0,      // viewportQueueSize
            0,      // normalQueueSize
            imageAILock.isLocked(),
            textAILock.isLocked(),
            0L      // averageProcessingTimeMs
        );
    }

    @Override
    public boolean cancelRequest(String requestId) {
        // TODO: 개발자 C 구현
        // 1. 큐에서 해당 요청 제거
        // 2. 처리 중인 요청은 인터럽트 (가능한 경우)

        log.info("요청 취소 시도 - 요청 ID: {}", requestId);
        return false; // 임시 구현
    }

    @Override
    public boolean isHealthy() {
        // TODO: 개발자 C 구현
        // 1. 큐 상태 확인
        // 2. AI 클라이언트들의 상태 확인
        // 3. 락 상태 점검 (데드락 방지)

        return false; // 스케줄러 미완성 상태 - 완성되면 true로 변경
    }

    /**
     * 요청을 타입별 우선순위 큐에 추가
     */
    private void enqueueRequest(ProcessingRequest request) {
        PriorityBlockingQueue<ProcessingRequest> targetQueue = getQueueForRequestType(request.getType());
        targetQueue.offer(request);

        // 통계 업데이트
        updateRequestStatistics(request.getType());

        log.debug("요청 큐 추가 - 타입: {}, 우선순위: {}, 큐 크기: {}",
            request.getType(), request.getPriority(), targetQueue.size());
    }

    /**
     * 요청 타입에 따른 큐 선택
     */
    private PriorityBlockingQueue<ProcessingRequest> getQueueForRequestType(ProcessingRequest.RequestType requestType) {
        return switch (requestType) {
            case IMAGE_ANALYSIS -> imageQueue;
            case TEXT_ANALYSIS -> textQueue;
        };
    }

    /**
     * 요청 통계 업데이트
     */
    private void updateRequestStatistics(ProcessingRequest.RequestType requestType) {
        switch (requestType) {
            case IMAGE_ANALYSIS -> totalImageRequests.incrementAndGet();
            case TEXT_ANALYSIS -> totalTextRequests.incrementAndGet();
        }
    }

    /**
     * 요청 타입에 따른 AI 클라이언트 선택
     * TODO: 개발자 C가 클라이언트 선택 로직 구현
     */
    private AIAnalysisClient selectAIClient(ProcessingRequest.RequestType requestType) {
        // TODO: 개발자 C 구현
        // return switch (requestType) {
        //     case IMAGE_ANALYSIS -> imageAIClient;
        //     case TEXT_ANALYSIS -> textAIClient;
        // };

        // ===== 임시 실행 함수 (플로우 체크 후 삭제 예정) =====
        return createTemporaryAIClient(requestType);
    }

    /**
     * 임시 AI 클라이언트 생성 함수
     * 플로우 체크 완료 후 삭제 예정
     */
    private AIAnalysisClient createTemporaryAIClient(ProcessingRequest.RequestType requestType) {
        return new AIAnalysisClient() {
            @Override
            public backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult analyze(ProcessingRequest request) throws AIAnalysisException {
                // 임시 AnalysisResult 생성
                if (requestType == ProcessingRequest.RequestType.IMAGE_ANALYSIS) {
                    return backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult.builder()
                        .success(true)
                        .analysisType("IMAGE_ANALYSIS")
                        .imageResults(java.util.List.of())
                        .processingStats(backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult.ProcessingStats.builder()
                            .totalRequested(1).successfullyProcessed(1).failed(0).hatefulCount(0).build())
                        .additionalData(java.util.Map.of())
                        .build();
                } else {
                    return backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult.builder()
                        .success(true)
                        .analysisType("TEXT_ANALYSIS")
                        .textResults(java.util.List.of())
                        .processingStats(backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult.ProcessingStats.builder()
                            .totalRequested(1).successfullyProcessed(1).failed(0).hatefulCount(0).build())
                        .additionalData(java.util.Map.of())
                        .build();
                }
            }

            @Override
            public boolean isHealthy() { return true; }

            @Override
            public boolean supportsRequestType(ProcessingRequest.RequestType type) { return true; }

            @Override
            public ClientInfo getClientInfo() {
                return new ClientInfo("TEMP_CLIENT", "localhost", "v1.0", 30000, true);
            }
        };
    }

    /**
     * 요청 타입에 따른 락 선택
     */
    private ReentrantLock getLockForRequestType(ProcessingRequest.RequestType requestType) {
        return switch (requestType) {
            case IMAGE_ANALYSIS -> imageAILock;
            case TEXT_ANALYSIS -> textAILock;
        };
    }

    /**
     * AI 클라이언트를 통한 실제 처리 수행
     * TODO: 개발자 C가 AI 분석 + 후처리 통합 로직 구현
     */
    private ProcessingResult processWithAI(
        ProcessingRequest request,
        AIAnalysisClient client,
        long startTime
    ) throws AIAnalysisClient.AIAnalysisException {

        // TODO: 실제 AI 분석 및 후처리 수행
        // 1. AI 클라이언트로 분석 수행
        // 2. PostProcessingUseCase 호출
        // 3. 결과 반환

        // ===== 임시 실행 함수 (플로우 체크 후 삭제 예정) =====
        backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult analysisResult = client.analyze(request);

        long processingTime = System.currentTimeMillis() - startTime;

        return ProcessingResult.builder()
            .requestId(request.getRequestId())
            .success(true)
            .analysisResult(analysisResult)
            .processingTimeMs(processingTime)
            .fromCache(false)
            .build();
    }
}