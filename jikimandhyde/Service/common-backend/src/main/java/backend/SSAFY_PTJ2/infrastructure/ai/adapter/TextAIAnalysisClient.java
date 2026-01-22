package backend.SSAFY_PTJ2.infrastructure.ai.adapter;

import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.TextProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.service.AIAnalysisClient;
import backend.SSAFY_PTJ2.domain.textfilter.dto.TextAIRequest;
import backend.SSAFY_PTJ2.global.config.AIClientProperties;
import backend.SSAFY_PTJ2.infrastructure.ai.TextAIClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * 텍스트 AI 분석 어댑터 - 개발자 B 담당
 *
 * ProcessingRequest를 TextAIRequest로 변환하여 실제 AI 클라이언트 호출
 * Socket.io → TextProcessingRequest → TextAIRequest → AI 컨테이너
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TextAIAnalysisClient implements AIAnalysisClient {

    private final TextAIClient textAIClient;
    private final AIClientProperties properties;

    /**
     * 텍스트 분석 요청 처리
     * TextProcessingRequest → TextAIRequest 변환 후 AI 클라이언트 호출
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

        if (!(request instanceof TextProcessingRequest textRequest)) {
            throw new AIAnalysisException(
                "Invalid request type for TextAIAnalysisClient",
                "INVALID_REQUEST_TYPE",
                false
            );
        }

        try {
            log.info("텍스트 AI 분석 시작 - requestId: {}, textCount: {}",
                request.getRequestId(), textRequest.getTextCount());

            // TextProcessingRequest → TextAIRequest 변환
            TextAIRequest aiRequest = convertToTextAIRequest(textRequest);

            // 실제 AI 클라이언트 호출
            AnalysisResult result = textAIClient.analyze(aiRequest);

            log.info("텍스트 AI 분석 완료 - requestId: {}, success: {}, resultCount: {}",
                request.getRequestId(), result.isSuccess(),
                result.getTextResults() != null ? result.getTextResults().size() : 0);

            return result;

        } catch (IllegalArgumentException e) {
            log.error("텍스트 요청 검증 실패 - requestId: {}", request.getRequestId(), e);
            throw new AIAnalysisException(
                "Text request validation failed: " + e.getMessage(),
                "VALIDATION_ERROR",
                false,
                e
            );
        } catch (Exception e) {
            log.error("텍스트 AI 분석 실패 - requestId: {}", request.getRequestId(), e);
            throw new AIAnalysisException(
                "Text AI analysis failed: " + e.getMessage(),
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
            return textAIClient.health();
        } catch (Exception e) {
            log.warn("텍스트 AI 헬스체크 실패", e);
            return false;
        }
    }

    /**
     * 텍스트 요청 타입만 지원
     */
    @Override
    public boolean supportsRequestType(ProcessingRequest.RequestType requestType) {
        return requestType == ProcessingRequest.RequestType.TEXT_ANALYSIS;
    }

    /**
     * 클라이언트 정보 조회
     */
    @Override
    public ClientInfo getClientInfo() {
        return new ClientInfo(
            "TEXT_AI_CLIENT",
            properties.getText().getBaseUrl(),
            "v1.0", // AI 모델 버전 (실제로는 AI 컨테이너에서 가져와야 함)
            properties.getTimeoutMs().getRead(),
            isHealthy()
        );
    }

    /**
     * TextProcessingRequest를 TextAIRequest로 변환
     */
    private TextAIRequest convertToTextAIRequest(TextProcessingRequest processingRequest) {
        if (!processingRequest.hasTexts()) {
            throw new IllegalArgumentException("텍스트 데이터가 없습니다.");
        }

        if (!processingRequest.areAllTextsValidLength()) {
            throw new IllegalArgumentException("텍스트 길이가 유효하지 않습니다.");
        }

        if (!processingRequest.doAllTextsHaveContent()) {
            throw new IllegalArgumentException("빈 텍스트가 포함되어 있습니다.");
        }

        // TextProcessingRequest.TextData → TextAIRequest.TextElement 변환
        List<TextAIRequest.TextElement> textElements = processingRequest.getTextDataList().stream()
            .map(textData -> TextAIRequest.TextElement.builder()
                .elementId(textData.getElementId())
                .texts(List.of(
                    TextAIRequest.TextData.builder()
                        .text(textData.getContent())
                        .sIdx(0)
                        .eIdx(textData.getContent().length())
                        .build()
                ))
                .build())
            .toList();

        return TextAIRequest.builder()
            .pageUrl(processingRequest.getPageUrl())
            .textElements(textElements)
            .textFilterCategory(getDefaultFilterCategories())
            .threshold(getDefaultThreshold())
            .build();
    }

    /**
     * 기본 필터 카테고리 설정
     * 모든 혐오 표현 카테고리를 활성화
     */
    private Map<String, Boolean> getDefaultFilterCategories() {
        return Map.of(
            "IN", true,  // 개인 대상 혐오 (Individual)
            "VI", true,  // 폭력적 혐오 (Violence)
            "SE", true,  // 성적 혐오 (Sexual)
            "AD", true,  // 광고/스팸 (Advertisement)
            "PO", true   // 정치적 혐오 (Political)
        );
    }

    /**
     * 기본 임계값 설정
     * 70% 이상의 확신도에서 혐오 표현으로 판단
     */
    private double getDefaultThreshold() {
        return 0.7;
    }
}