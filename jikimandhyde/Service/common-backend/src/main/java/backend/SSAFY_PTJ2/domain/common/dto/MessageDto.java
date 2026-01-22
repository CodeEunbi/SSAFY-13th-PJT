package backend.SSAFY_PTJ2.domain.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 메시지 전송을 위한 공통 DTO
 * Socket.IO와 HTTP 통신에서 사용되는 메시지 구조
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {

    /**
     * 메시지 고유 ID
     */
    private String messageId;

    /**
     * 메시지 타입 (TEXT, IMAGE, GENERAL 등)
     */
    private MessageType type;

    /**
     * 메시지 내용
     */
    private String content;

    /**
     * 메시지 데이터 (Base64 인코딩된 이미지 등)
     */
    private String data;

    /**
     * 추가 메타데이터
     */
    private Map<String, Object> metadata;

    /**
     * 메시지 생성 시간
     */
    private LocalDateTime timestamp;

    /**
     * 송신자 정보
     */
    private String senderId;

    /**
     * 처리 상태
     */
    private ProcessStatus status;

    /**
     * 에러 메시지 (처리 실패 시)
     */
    private String errorMessage;

    /**
     * 메시지 타입 열거형
     */
    public enum MessageType {
        TEXT,           // 텍스트 메시지
        IMAGE,          // 이미지 메시지
        GENERAL,        // 일반 메시지
        FILTER_REQUEST, // 필터링 요청
        FILTER_RESPONSE // 필터링 응답
    }

    /**
     * 처리 상태 열거형
     */
    public enum ProcessStatus {
        PENDING,    // 대기 중
        PROCESSING, // 처리 중
        COMPLETED,  // 처리 완료
        FAILED      // 처리 실패
    }
}