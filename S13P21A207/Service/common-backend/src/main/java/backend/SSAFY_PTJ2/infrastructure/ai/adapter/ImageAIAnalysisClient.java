package backend.SSAFY_PTJ2.infrastructure.ai.adapter;

import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.common.dto.ImageProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.service.AIAnalysisClient;
import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageAIRequest;
import backend.SSAFY_PTJ2.global.config.AIClientProperties;
import backend.SSAFY_PTJ2.infrastructure.ai.ImageAIClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.IntStream;

/**
 * 이미지 AI 분석 어댑터 - 개발자 B 담당
 *
 * ProcessingRequest를 ImageAIRequest로 변환하여 실제 AI 클라이언트 호출
 * Socket.io → ImageProcessingRequest → ImageAIRequest → AI 컨테이너
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ImageAIAnalysisClient implements AIAnalysisClient {

    private final ImageAIClient imageAIClient;
    private final AIClientProperties properties;

    /**
     * 이미지 분석 요청 처리
     * ImageProcessingRequest → ImageAIRequest 변환 후 AI 클라이언트 호출
     */
    @Override
    public AnalysisResult analyze(ProcessingRequest request) throws AIAnalysisException {
        if (!supportsRequestType(request.getType())) {
            throw new AIAnalysisException(
                "Unsupported request type: " + request.getType(),
                "UNSUPPORTED_TYPE",
                false
            );
        }

        if (!(request instanceof ImageProcessingRequest imageRequest)) {
            throw new AIAnalysisException(
                "Invalid request type for ImageAIAnalysisClient",
                "INVALID_REQUEST_TYPE",
                false
            );
        }

        try {
            log.info("이미지 AI 분석 시작 - requestId: {}, imageCount: {}",
                request.getRequestId(), imageRequest.getImageCount());

            // ImageProcessingRequest → ImageAIRequest 변환
            ImageAIRequest aiRequest = convertToImageAIRequest(imageRequest);

            // 실제 AI 클라이언트 호출
            AnalysisResult result = imageAIClient.analyze(aiRequest);

            log.info("이미지 AI 분석 완료 - requestId: {}, success: {}, resultCount: {}",
                request.getRequestId(), result.isSuccess(),
                result.getImageResults() != null ? result.getImageResults().size() : 0);

            return result;

        } catch (IllegalArgumentException e) {
            log.error("이미지 요청 검증 실패 - requestId: {}", request.getRequestId(), e);
            throw new AIAnalysisException(
                "Image request validation failed: " + e.getMessage(),
                "VALIDATION_ERROR",
                false,
                e
            );
        } catch (Exception e) {
            log.error("이미지 AI 분석 실패 - requestId: {}", request.getRequestId(), e);
            throw new AIAnalysisException(
                "Image AI analysis failed: " + e.getMessage(),
                "AI_ANALYSIS_ERROR",
                true, // 재시도 가능
                e
            );
        }
    }

    /**
     * AI 컨테이너 상태 확인
     */
    @Override
    public boolean isHealthy() {
        try {
            return imageAIClient.health();
        } catch (Exception e) {
            log.warn("이미지 AI 헬스체크 실패", e);
            return false;
        }
    }

    /**
     * 이미지 요청 타입만 지원
     */
    @Override
    public boolean supportsRequestType(ProcessingRequest.RequestType requestType) {
        return requestType == ProcessingRequest.RequestType.IMAGE_ANALYSIS;
    }

    /**
     * 클라이언트 정보 조회
     */
    @Override
    public ClientInfo getClientInfo() {
        return new ClientInfo(
            "IMAGE_AI_CLIENT",
            properties.getImage().getBaseUrl(),
            "v1.0", // AI 모델 버전 (실제로는 AI 컨테이너에서 가져와야 함)
            properties.getTimeoutMs().getRead(),
            isHealthy()
        );
    }

    /**
     * ImageProcessingRequest를 ImageAIRequest로 변환
     */
    private ImageAIRequest convertToImageAIRequest(ImageProcessingRequest processingRequest) {
        if (!processingRequest.hasImages()) {
            throw new IllegalArgumentException("이미지 데이터가 없습니다.");
        }

        if (!processingRequest.areAllImagesValidSize()) {
            throw new IllegalArgumentException("이미지 크기가 유효하지 않습니다.");
        }

        if (!processingRequest.areAllImagesSupported()) {
            throw new IllegalArgumentException("지원하지 않는 이미지 형식이 포함되어 있습니다.");
        }

        // ImageProcessingRequest.ImageData → ImageAIRequest.ImageFile 변환
        List<ImageAIRequest.ImageFile> imageFiles = IntStream.range(0, processingRequest.getImageDataList().size())
            .mapToObj(index -> {
                ImageProcessingRequest.ImageData imageData = processingRequest.getImageDataList().get(index);

                return ImageAIRequest.ImageFile.builder()
                    .id(getImageId(imageData, processingRequest.getRequestId(), index))
                    .filename(generateFilename(imageData, index))
                    .imageData(imageData.getData())
                    .mimeType(imageData.getMimeType())
                    .size(imageData.getSize())
                    .build();
            })
            .toList();

        return ImageAIRequest.builder()
            .imageFiles(imageFiles)
            .build();
    }

    /**
     * 이미지 ID 조회
     * 클라이언트에서 제공한 elementId를 우선 사용, 없으면 생성
     */
    private String getImageId(ImageProcessingRequest.ImageData imageData, String requestId, int index) {
        if (imageData.getElementId() != null && !imageData.getElementId().trim().isEmpty()) {
            return imageData.getElementId();
        }
        return generateImageId(requestId, index);
    }

    /**
     * 고유한 이미지 ID 생성 (fallback)
     */
    private String generateImageId(String requestId, int index) {
        return String.format("%s-img-%d", requestId, index);
    }

    /**
     * 파일명 생성 (원본 파일명이 없을 경우 생성)
     */
    private String generateFilename(ImageProcessingRequest.ImageData imageData, int index) {
        if (imageData.getFileName() != null && !imageData.getFileName().trim().isEmpty()) {
            return imageData.getFileName();
        }

        // 파일명이 없으면 MIME 타입 기반으로 생성
        String extension = imageData.getFileExtension();
        return String.format("image_%d%s", index, extension);
    }
}