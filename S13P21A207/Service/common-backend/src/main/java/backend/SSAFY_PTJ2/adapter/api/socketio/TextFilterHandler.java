package backend.SSAFY_PTJ2.adapter.api.socketio;

import backend.SSAFY_PTJ2.adapter.api.dto.TextAnalysisSocketRequest;
import backend.SSAFY_PTJ2.adapter.api.dto.TextAnalysisSocketResponse;
import backend.SSAFY_PTJ2.application.ProcessingOrchestrator;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingRequest;
import backend.SSAFY_PTJ2.domain.common.dto.ProcessingResult;
import backend.SSAFY_PTJ2.domain.common.dto.TextProcessingRequest;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.DataListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 텍스트 필터링 관련 Socket.IO 이벤트 핸들러 - 개발자 D 담당
 *
 * 변경사항:
 * - 기존 비동기 처리 → 동기 처리로 변경
 * - ProcessingOrchestrator를 통한 통합 처리 플로우 사용
 * - Notion 명세 기준 이벤트명 사용 (text-analysis)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TextFilterHandler {

    private final SocketIOServer socketIOServer;
    private final ProcessingOrchestrator processingOrchestrator;

    @PostConstruct
    public void registerEventListeners() {
        registerTextAnalysisListener();
    }

    /**
     * text-analysis 이벤트 리스너 등록
     * 텍스트 컨텐츠 AI 분석 요청을 동기적으로 처리합니다.
     *
     * 클라이언트 전송 형식: socket.emit('text-analysis', textDataArray)
     * - 텍스트 메타데이터와 내용이 포함된 배열
     */
    private void registerTextAnalysisListener() {
        DataListener<TextAnalysisSocketRequest[]> onTextAnalysis = (client, textDataArray, ackSender) -> {
            String requestId = UUID.randomUUID().toString();
            log.info("텍스트 분석 요청 수신 - 요청 ID: {}, 세션: {}, 텍스트 수: {}",
                requestId, client.getSessionId(), textDataArray.length);

            try {
                // 1. 배열을 리스트로 변환 후 TextProcessingRequest로 변환
                List<TextAnalysisSocketRequest> textDataList = Arrays.asList(textDataArray);

                TextProcessingRequest batchRequest = convertToTextProcessingRequest(
                    textDataList, client.getSessionId().toString(), requestId);

                // 2. 배치로 한번에 처리
                ProcessingResult result = processingOrchestrator.processSync(batchRequest);

                // 3. 처리 결과를 ACK 응답으로 전송
                if (result.isSuccess()) {
                    ackSender.sendAckData(convertToClientResponse(result));
                    log.info("배치 텍스트 분석 완료 - 요청 ID: {}, 텍스트 수: {}, 소요시간: {}ms",
                        requestId, batchRequest.getTextCount(), result.getProcessingTimeMs());
                } else {
                    ackSender.sendAckData(createErrorResponse(result.getErrorInfo()));
                    log.warn("배치 텍스트 분석 실패 - 요청 ID: {}, 오류: {}",
                        requestId, result.getErrorInfo().getErrorMessage());
                }

            } catch (Exception e) {
                log.error("텍스트 분석 핸들러 오류 - 요청 ID: {}", requestId, e);
                ackSender.sendAckData(createErrorResponse("SV102", "서버 내부 오류", "시스템"));
            }
        };

        socketIOServer.addEventListener("text-analysis", TextAnalysisSocketRequest[].class, onTextAnalysis);
    }

    /**
     * TextAnalysisSocketRequest 배열을 배치 TextProcessingRequest로 변환
     */
    private TextProcessingRequest convertToTextProcessingRequest(
        List<TextAnalysisSocketRequest> textDataList, String sessionId, String requestId) {

        List<TextProcessingRequest.TextData> textProcessingDataList = new ArrayList<>();
        ProcessingRequest.Priority batchPriority = ProcessingRequest.Priority.NORMAL;
        String batchPageUrl = null;

        // 각 텍스트 데이터를 TextData 객체로 변환
        for (TextAnalysisSocketRequest textRequest : textDataList) {
            // 첫 번째 텍스트의 pageUrl을 배치 전체의 pageUrl로 사용
            if (batchPageUrl == null) {
                batchPageUrl = textRequest.getPageUrl();
            }

            // 우선순위 판별 - 하나라도 HIGH면 배치 전체를 HIGH로
            ProcessingRequest.Priority itemPriority = determineTextPriority(textRequest.getElementMetadata());
            if (itemPriority == ProcessingRequest.Priority.HIGH) {
                batchPriority = ProcessingRequest.Priority.HIGH;
            }

            TextProcessingRequest.TextData textData = TextProcessingRequest.TextData.builder()
                .elementId(textRequest.getElementId())
                .content(textRequest.getContent())
                .pageUrl(textRequest.getPageUrl())
                .elementMetadata(textRequest.getElementMetadata())
                .build();

            textProcessingDataList.add(textData);
        }

        return TextProcessingRequest.builder()
            .requestId(requestId)
            .priority(batchPriority)
            .timestamp(LocalDateTime.now())
            .sessionId(sessionId)
            .elementId("batch_" + requestId) // 배치 요청임을 나타내는 elementId
            .pageUrl(batchPageUrl)
            .textDataList(textProcessingDataList)
            .build();
    }

    /**
     * 텍스트 우선순위 판별
     * TODO: 개발자 D가 뷰포트 여부 확인 로직 구현
     */
    private ProcessingRequest.Priority determineTextPriority(Map<String, Object> elementMetadata) {
        // TODO: elementMetadata에서 뷰포트 내 여부 확인
        // 예: elementMetadata.get("inViewport") 등
        return ProcessingRequest.Priority.NORMAL; // 임시 구현
    }

    /**
     * ProcessingResult를 노션 명세에 맞는 클라이언트 응답 형식으로 변환
     */
    private TextAnalysisSocketResponse convertToClientResponse(ProcessingResult result) {
        String processedAt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "Z";

        // 분석 결과에서 텍스트 결과를 추출하여 변환
        List<TextAnalysisSocketResponse.TextResult> textResults = new ArrayList<>();

        if (result.getAnalysisResult() != null && result.getAnalysisResult().getTextResults() != null) {
            textResults = result.getAnalysisResult().getTextResults().stream()
                .map(textResult -> {
                    // 필터링된 인덱스 변환 (TextRange.category가 이미 List<String>)
                    List<TextAnalysisSocketResponse.FilteredIndex> filteredIndexes =
                        textResult.getHatefulRanges() != null ?
                        textResult.getHatefulRanges().stream()
                            .map(range -> TextAnalysisSocketResponse.FilteredIndex.builder()
                                .start(range.getStartIndex())
                                .end(range.getEndIndex())
                                .type(range.getCategory())  // TextRange.category가 이미 List<String>이므로 그대로 사용
                                .confidence(range.getScore())
                                .build())
                            .collect(Collectors.toList()) :
                        new ArrayList<>();

                    return TextAnalysisSocketResponse.TextResult.builder()
                        .elementId(textResult.getElementId())
                        .filteredIndexes(filteredIndexes)
                        .originalLength(textResult.getOriginalLength())
                        .processedAt(processedAt)
                        .processingTime(result.getProcessingTimeMs()) // 개별 처리시간은 전체와 동일하게 설정
                        .build();
                })
                .collect(Collectors.toList());
        }

        return TextAnalysisSocketResponse.builder()
            .processingTime(result.getProcessingTimeMs())
            .processedAt(processedAt)
            .results(textResults)
            .build();
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