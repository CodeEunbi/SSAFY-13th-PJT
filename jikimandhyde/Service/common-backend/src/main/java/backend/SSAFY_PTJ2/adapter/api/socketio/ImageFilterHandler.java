package backend.SSAFY_PTJ2.adapter.api.socketio;

import backend.SSAFY_PTJ2.adapter.api.dto.ImageAnalysisSocketRequest;
import backend.SSAFY_PTJ2.application.ProcessingOrchestrator;
import backend.SSAFY_PTJ2.domain.common.dto.ImageProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingResult;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.DataListener;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.LinkedHashMap;

/**
 * 이미지 필터링 관련 Socket.IO 이벤트 핸들러 - 개발자 D 담당
 *
 * 변경사항:
 * - 기존 비동기 처리 → 동기 처리로 변경
 * - ProcessingOrchestrator를 통한 통합 처리 플로우 사용
 * - Notion 명세 기준 이벤트명 사용 (image-analysis)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ImageFilterHandler {

    private final SocketIOServer socketIOServer;
    private final ProcessingOrchestrator processingOrchestrator;
    private final ObjectMapper objectMapper;

    @PostConstruct
    public void registerEventListeners() {
        registerImageAnalysisListener();
    }

    /**
     * image-analysis 이벤트 리스너 등록
     * 이미지 컨텐츠 AI 분석 요청을 동기적으로 처리합니다.
     *
     * 클라이언트 전송 형식: socket.emit('image-analysis', imageDataArray)
     * - 이미지 메타데이터와 바이너리 데이터가 포함된 배열
     */
    private void registerImageAnalysisListener() {
        DataListener<ImageAnalysisSocketRequest[]> onImageAnalysis = (client, imageDataArray, ackSender) -> {
            String requestId = UUID.randomUUID().toString();
            log.info("이미지 분석 요청 수신 - 요청 ID: {}, 세션: {}, 이미지 수: {}",
                requestId, client.getSessionId(), imageDataArray.length);

            try {
                // 1. 배열을 리스트로 변환 후 ImageProcessingRequest로 변환
                List<ImageAnalysisSocketRequest> imageDataList = Arrays.asList(imageDataArray);

                // 🔍 디버깅용: 이미지 파일 저장
                //saveImageFilesForDebugging(imageDataList);

                ImageProcessingRequest batchRequest = convertToImageProcessingRequest(
                    imageDataList, client.getSessionId().toString(), requestId);

                // 2. 배치로 한번에 처리
                ProcessingResult result = processingOrchestrator.processSync(batchRequest);

                // 3. 처리 결과를 ACK 응답으로 전송
                if (result.isSuccess()) {
                    Object ackResponseData = result.getPostProcessedData();
                    ackSender.sendAckData(ackResponseData != null ? ackResponseData : convertToClientResponse(result));
                    log.info("배치 이미지 분석 완료 - 요청 ID: {}, 이미지 수: {}, 소요시간: {}ms",
                        requestId, batchRequest.getImageCount(), result.getProcessingTimeMs());
                } else {
                    ackSender.sendAckData(createErrorResponse(result.getErrorInfo()));
                    log.warn("배치 이미지 분석 실패 - 요청 ID: {}, 오류: {}",
                        requestId, result.getErrorInfo().getErrorMessage());
                }

            } catch (Exception e) {
                log.error("이미지 분석 핸들러 오류 - 요청 ID: {}", requestId, e);
                ackSender.sendAckData(createErrorResponse("SV102", "서버 내부 오류: " + e.getMessage(), "시스템"));
            }
        };

        socketIOServer.addEventListener("image-analysis", ImageAnalysisSocketRequest[].class, onImageAnalysis);
    }

    /**
     * Socket.IO 요청 DTO를 ImageProcessingRequest로 변환
     * 메타데이터와 바이너리 데이터가 하나의 DTO에 포함된 형태
     */
    private ImageProcessingRequest convertToImageProcessingRequest(
        List<ImageAnalysisSocketRequest> imageDataList, String sessionId, String requestId) {

        List<ImageProcessingRequest.ImageData> processedImageDataList = new ArrayList<>();
        ProcessingRequest.Priority batchPriority = ProcessingRequest.Priority.NORMAL;
        String batchPageUrl = null;

        for (ImageAnalysisSocketRequest socketRequest : imageDataList) {
            String elementId = socketRequest.getElementId();
            String mimeType = socketRequest.getMimeType();
            byte[] binaryData = socketRequest.getImageData();
            long size = socketRequest.getSize() != null ? socketRequest.getSize() : binaryData.length;
            String pageUrl = socketRequest.getPageUrl();
            Map<String, Object> imageMetadata = socketRequest.getImageMetadata();

            // 첫 번째 이미지의 pageUrl을 배치 전체의 pageUrl로 사용
            if (batchPageUrl == null) {
                batchPageUrl = pageUrl;
            }

            // 우선순위 판별 - 뷰포트 진입 이미지는 HIGH 우선순위
            ProcessingRequest.Priority itemPriority = determineImagePriority(imageMetadata);
            if (itemPriority == ProcessingRequest.Priority.HIGH) {
                batchPriority = ProcessingRequest.Priority.HIGH;
            }

            // 파일명 생성
            String fileName = elementId + getFileExtension(mimeType);

            ImageProcessingRequest.ImageData imageData = ImageProcessingRequest.ImageData.builder()
                .data(binaryData)
                .mimeType(mimeType)
                .fileName(fileName)
                .size(size)
                .elementId(elementId)
                .metadata(imageMetadata)
                .build();

            processedImageDataList.add(imageData);

            log.debug("이미지 데이터 추가 - ElementId: {}, MimeType: {}, Size: {}bytes",
                elementId, mimeType, size);
        }

        log.info("배치 이미지 처리 요청 생성 - 총 이미지 수: {}, 우선순위: {}",
            processedImageDataList.size(), batchPriority);

        return ImageProcessingRequest.builder()
            .requestId(requestId)
            .priority(batchPriority)
            .timestamp(LocalDateTime.now())
            .sessionId(sessionId)
            .elementId("batch_" + requestId)
            .pageUrl(batchPageUrl)
            .imageDataList(processedImageDataList)
            .build();
    }

    /**
     * 🔍 디버깅용: 이미지 파일 저장
     * 클라이언트에서 전송된 이미지가 서버에 정상적으로 도착했는지 확인하기 위해
     * temp/{elementId} 경로에 실제 이미지 파일로 저장합니다.
     */
    private void saveImageFilesForDebugging(List<ImageAnalysisSocketRequest> imageDataList) {
        try {
            // temp 디렉토리 생성
            Path tempDir = Paths.get("temp");
            if (!Files.exists(tempDir)) {
                Files.createDirectories(tempDir);
            }

            for (ImageAnalysisSocketRequest socketRequest : imageDataList) {
                String elementId = socketRequest.getElementId();
                String mimeType = socketRequest.getMimeType();
                byte[] imageData = socketRequest.getImageData();

                if (imageData != null && imageData.length > 0) {
                    String fileExtension = getFileExtension(mimeType);
                    String fileName = elementId + fileExtension;
                    Path filePath = tempDir.resolve(fileName);

                    // 이미지 파일 저장
                    Files.write(filePath, imageData);
                    log.info("🔍 디버깅용 이미지 저장 완료 - 파일: {}, 크기: {}bytes, MIME: {}",
                        filePath.toAbsolutePath(), imageData.length, mimeType);
                } else {
                    log.warn("🔍 디버깅용 이미지 저장 실패 - ElementId: {}, 이미지 데이터 없음", elementId);
                }
            }

            log.info("🔍 디버깅용 이미지 저장 완료 - 총 {}개 파일 저장됨", imageDataList.size());

        } catch (IOException e) {
            log.error("🔍 디버깅용 이미지 저장 중 오류 발생", e);
        }
    }

    /**
     * 이미지 우선순위 판별
     * TODO: 개발자 D가 뷰포트 여부 확인 로직 구현
     */
    private ProcessingRequest.Priority determineImagePriority(Map<String, Object> imageMetadata) {
        // TODO: imageMetadata에서 뷰포트 내 여부 확인
        // 예: imageMetadata.get("inViewport") 등
        return ProcessingRequest.Priority.NORMAL; // 임시 구현
    }

    /**
     * MIME 타입에 따른 파일 확장자 반환
     */
    private String getFileExtension(String mimeType) {
        return switch (mimeType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            case "image/avif" -> ".avif";
            case "image/bmp" -> ".bmp";
            case "image/tiff" -> ".tiff";
            case "image/x-icon" -> ".ico";
            default -> ".jpg";
        };
    }

    /**
     * ProcessingResult를 클라이언트 응답 형식으로 변환
     * TODO: 개발자 D가 클라이언트 응답 스펙에 맞게 구현
     */
    private Object convertToClientResponse(ProcessingResult result) {
        // TODO: Notion 명세에 맞는 응답 형식으로 변환
        // - 혐오 이미지 감지 여부
        // - 카테고리별 분류 결과
        // - 신뢰도 점수 등

        return Map.of(
            "requestId", result.getRequestId(),
            "success", result.isSuccess(),
            "analysisResult", result.getAnalysisResult(),
            "processingTime", result.getProcessingTimeMs(),
            "fromCache", result.isFromCache()
        );
    }

    /**
     * 에러 응답 생성 (ProcessingResult.ErrorInfo 기반)
     */
    private Object createErrorResponse(ProcessingResult.ErrorInfo errorInfo) {
        return Map.of(
            "success", false,
            "errorCode", errorInfo.getErrorCode(),
            "message", errorInfo.getErrorMessage(),
            "category", errorInfo.getCategory(),
            "timestamp", System.currentTimeMillis()
        );
    }

    /**
     * 에러 응답 생성 (직접 생성)
     */
    private Object createErrorResponse(String errorCode, String message, String category) {
        return Map.of(
            "success", false,
            "errorCode", errorCode,
            "message", message,
            "category", category,
            "timestamp", System.currentTimeMillis()
        );
    }

}