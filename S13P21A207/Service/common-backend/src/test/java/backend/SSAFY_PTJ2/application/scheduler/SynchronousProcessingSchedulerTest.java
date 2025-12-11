//package backend.SSAFY_PTJ2.application.scheduler;
//
//import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
//import backend.SSAFY_PTJ2.domain.common.dto.ImageProcessingRequest;
//import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
//import backend.SSAFY_PTJ2.domain.common.dto.ProcessingResult;
//import backend.SSAFY_PTJ2.domain.common.service.AIAnalysisClient;
//import backend.SSAFY_PTJ2.domain.common.service.ProcessingScheduler;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.Map;
//import java.util.concurrent.CompletableFuture;
//import java.util.concurrent.CountDownLatch;
//import java.util.concurrent.ExecutorService;
//import java.util.concurrent.Executors;
//
//import static org.assertj.core.api.Assertions.assertThat;
//import static org.assertj.core.api.Assertions.assertThatThrownBy;
//import static org.mockito.ArgumentMatchers.any;
//import static org.mockito.Mockito.when;
//
///**
// * 동기 처리 스케줄러 테스트 - 개발자 C 담당
// *
// * 이미지/텍스트 분리된 우선순위 큐, 락 관리, 동시성 처리에 대한 테스트
// * - 이미지 AI 컨테이너와 텍스트 AI 컨테이너별 독립적인 큐 및 락 테스트
// *
// * 개발자 C는 이 기본 구조를 참고하여 더 많은 테스트 케이스를 추가하세요.
// */
//@ExtendWith(MockitoExtension.class)
//class SynchronousProcessingSchedulerTest {
//
//    @Mock
//    private AIAnalysisClient imageAIClient;
//
//    @Mock
//    private AIAnalysisClient textAIClient;
//
//    private ProcessingScheduler scheduler;
//
//    @BeforeEach
//    void setUp() {
//        // TODO: 개발자 C가 실제 스케줄러 의존성 주입
//        scheduler = new SynchronousProcessingScheduler(/* AI 클라이언트 목록 */);
//
//        // Mock AI 클라이언트 기본 동작 설정
//        when(imageAIClient.supportsRequestType(ProcessingRequest.RequestType.IMAGE_ANALYSIS))
//                .thenReturn(true);
//        when(textAIClient.supportsRequestType(ProcessingRequest.RequestType.TEXT_ANALYSIS))
//                .thenReturn(true);
//    }
//
//    @Test
//    void 이미지_분석_요청_정상_처리_테스트() throws Exception {
//        // Given
//        ProcessingRequest request = createImageAnalysisRequest();
//        AnalysisResult mockAnalysisResult = createMockAnalysisResult();
//
//        when(imageAIClient.analyze(any(ProcessingRequest.class)))
//                .thenReturn(mockAnalysisResult);
//
//        // When
//        ProcessingResult result = scheduler.scheduleAndProcess(request);
//
//        // Then
//        assertThat(result.isSuccess()).isTrue();
//        assertThat(result.getRequestId()).isEqualTo(request.getRequestId());
//        assertThat(result.getProcessingTimeMs()).isGreaterThan(0);
//    }
//
//    @Test
//    void 뷰포트_우선순위_요청_우선_처리_테스트() throws Exception {
//        // Given
//        ProcessingRequest normalRequest = createNormalPriorityRequest();
//        ProcessingRequest viewportRequest = createViewportPriorityRequest();
//
//        // TODO: 개발자 C가 우선순위 검증 로직 구현
//        // 1. 두 요청을 동시에 큐에 추가
//        // 2. viewport 우선순위가 먼저 처리되는지 확인
//
//        // When & Then
//        // 임시 구현 - 개발자 C가 실제 우선순위 테스트 로직 추가
//        assertThat(viewportRequest.getPriority().getLevel())
//                .isLessThan(normalRequest.getPriority().getLevel());
//    }
//
//    @Test
//    void 동시_이미지_분석_요청_락_테스트() throws Exception {
//        // Given
//        int numberOfRequests = 3;
//        CountDownLatch startLatch = new CountDownLatch(1);
//        CountDownLatch completeLatch = new CountDownLatch(numberOfRequests);
//        ExecutorService executor = Executors.newFixedThreadPool(numberOfRequests);
//
//        // AI 분석에 시간이 걸리도록 Mock 설정
//        when(imageAIClient.analyze(any(ProcessingRequest.class)))
//                .thenAnswer(invocation -> {
//                    Thread.sleep(100); // 분석 시간 시뮬레이션
//                    return createMockAnalysisResult();
//                });
//
//        // When
//        List<CompletableFuture<ProcessingResult>> futures = List.of(
//            CompletableFuture.supplyAsync(() -> {
//                try {
//                    startLatch.await();
//                    return scheduler.scheduleAndProcess(createImageAnalysisRequest());
//                } catch (Exception e) {
//                    throw new RuntimeException(e);
//                } finally {
//                    completeLatch.countDown();
//                }
//            }, executor),
//            CompletableFuture.supplyAsync(() -> {
//                try {
//                    startLatch.await();
//                    return scheduler.scheduleAndProcess(createImageAnalysisRequest());
//                } catch (Exception e) {
//                    throw new RuntimeException(e);
//                } finally {
//                    completeLatch.countDown();
//                }
//            }, executor),
//            CompletableFuture.supplyAsync(() -> {
//                try {
//                    startLatch.await();
//                    return scheduler.scheduleAndProcess(createImageAnalysisRequest());
//                } catch (Exception e) {
//                    throw new RuntimeException(e);
//                } finally {
//                    completeLatch.countDown();
//                }
//            }, executor)
//        );
//
//        startLatch.countDown(); // 모든 스레드 동시 시작
//
//        // Then
//        completeLatch.await(); // 모든 요청 완료 대기
//
//        // 모든 요청이 성공적으로 처리되었는지 확인
//        for (CompletableFuture<ProcessingResult> future : futures) {
//            ProcessingResult result = future.get();
//            assertThat(result.isSuccess()).isTrue();
//        }
//
//        executor.shutdown();
//    }
//
//    @Test
//    void AI_클라이언트_예외_처리_테스트() throws Exception {
//        // Given
//        ProcessingRequest request = createImageAnalysisRequest();
//
//        when(imageAIClient.analyze(any(ProcessingRequest.class)))
//                .thenThrow(new AIAnalysisClient.AIAnalysisException(
//                    "AI 분석 실패", "AI301", true));
//
//        // When & Then
//        assertThatThrownBy(() -> scheduler.scheduleAndProcess(request))
//                .isInstanceOf(ProcessingScheduler.ProcessingException.class)
//                .hasMessageContaining("처리 중 오류");
//    }
//
//    @Test
//    void 큐_상태_조회_테스트() {
//        // When
//        ProcessingScheduler.QueueStatus status = scheduler.getQueueStatus();
//
//        // Then
//        assertThat(status).isNotNull();
//        assertThat(status.totalQueueSize()).isGreaterThanOrEqualTo(0);
//        assertThat(status.averageProcessingTimeMs()).isGreaterThanOrEqualTo(0);
//    }
//
//    @Test
//    void 스케줄러_헬스체크_테스트() {
//        // When
//        boolean isHealthy = scheduler.isHealthy();
//
//        // Then
//        assertThat(isHealthy).isTrue();
//    }
//
//    // TODO: 개발자 C가 추가할 테스트 케이스들:
//    // - 이미지/텍스트 분리된 큐 테스트 (이미지와 텍스트 요청이 각각의 큐에 들어가는지)
//    // - 이미지/텍스트 분리된 락 테스트 (이미지 락과 텍스트 락이 독립적으로 동작하는지)
//    // - 텍스트 처리 요청 테스트 (TextProcessingRequest 처리)
//    // - 동시 이미지+텍스트 요청 독립성 테스트 (서로 다른 AI 컨테이너로 동시 처리)
//    // - 요청 취소 테스트
//    // - 타임아웃 처리 테스트
//    // - 메모리 사용량 모니터링 테스트
//    // - 부하 테스트 (대량 요청 처리)
//    // - 데드락 방지 테스트
//
//    /**
//     * 테스트용 이미지 분석 요청 생성
//     */
//    private ImageProcessingRequest createImageAnalysisRequest() {
//        return ImageProcessingRequest.builder()
//                .requestId("test-image-" + System.currentTimeMillis())
//                .priority(ProcessingRequest.Priority.NORMAL)
//                .timestamp(LocalDateTime.now())
//                .sessionId("test-session")
//                .elementId("img_test_" + System.currentTimeMillis())
//                .pageUrl("https://test.example.com")
//                .imageData("test_image_content".getBytes())
//                .mimeType("image/jpeg")
//                .fileName("test_image.jpg")
//                .size(1024L)
//                .imageMetadata(Map.of("width", 800, "height", 600))
//                .build();
//    }
//
//    /**
//     * 테스트용 일반 우선순위 요청 생성
//     */
//    private ImageProcessingRequest createNormalPriorityRequest() {
//        return ImageProcessingRequest.builder()
//                .requestId("normal-priority-request")
//                .priority(ProcessingRequest.Priority.NORMAL)
//                .timestamp(LocalDateTime.now())
//                .sessionId("test-session")
//                .elementId("img_normal")
//                .pageUrl("https://test.example.com")
//                .imageData("normal_image_content".getBytes())
//                .mimeType("image/png")
//                .fileName("normal_image.png")
//                .size(2048L)
//                .imageMetadata(Map.of("width", 400, "height", 300))
//                .build();
//    }
//
//    /**
//     * 테스트용 뷰포트 우선순위 요청 생성
//     */
//    private ImageProcessingRequest createViewportPriorityRequest() {
//        return ImageProcessingRequest.builder()
//                .requestId("viewport-priority-request")
//                .priority(ProcessingRequest.Priority.VIEWPORT)
//                .timestamp(LocalDateTime.now())
//                .sessionId("test-session")
//                .elementId("img_viewport")
//                .pageUrl("https://test.example.com")
//                .imageData("viewport_image_content".getBytes())
//                .mimeType("image/webp")
//                .fileName("viewport_image.webp")
//                .size(3072L)
//                .imageMetadata(Map.of("width", 1200, "height", 800, "inViewport", true))
//                .build();
//    }
//
//    /**
//     * 테스트용 Mock 분석 결과 생성
//     */
//    private AnalysisResult createMockAnalysisResult() {
//        return AnalysisResult.builder()
//                .success(true)
//                .isHateful(false)
//                .confidenceScore(0.95)
//                .detectedCategories(List.of())
//                .hatefulRanges(List.of())
//                .hatefulRegions(List.of())
//                .additionalData(Map.of())
//                .build();
//    }
//}