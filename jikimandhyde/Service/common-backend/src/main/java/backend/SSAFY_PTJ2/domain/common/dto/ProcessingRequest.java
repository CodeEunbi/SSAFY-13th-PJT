package backend.SSAFY_PTJ2.domain.common.dto;

import lombok.Getter;

import java.time.LocalDateTime;

/**
 * AI 분석 처리 요청 추상 클래스
 * 모든 유닛이 공유하는 핵심 요청 데이터 구조
 *
 * 타입별 구체 클래스:
 * - ImageProcessingRequest: 이미지 분석 요청
 * - TextProcessingRequest: 텍스트 분석 요청
 */
@Getter
public abstract class ProcessingRequest implements Comparable<ProcessingRequest> {

    /**
     * 요청 고유 식별자
     */
    protected final String requestId;

    /**
     * 요청 타입 (이미지/텍스트)
     */
    protected final RequestType type;

    /**
     * 처리 우선순위 (뷰포트 컨텐츠가 높은 우선순위)
     */
    protected final Priority priority;

    /**
     * 요청 생성 시간 (우선순위 계산에 사용)
     */
    protected final LocalDateTime timestamp;

    /**
     * 사용자 세션 ID
     */
    protected final String sessionId;

    /**
     * DOM 요소 식별자 (공통 필드)
     */
    protected final String elementId;

    /**
     * 페이지 URL (공통 필드)
     */
    protected final String pageUrl;

    /**
     * 생성자 - 하위 클래스에서 사용
     */
    protected ProcessingRequest(String requestId, RequestType type, Priority priority,
                                LocalDateTime timestamp, String sessionId, String elementId, String pageUrl) {
        this.requestId = requestId;
        this.type = type;
        this.priority = priority;
        this.timestamp = timestamp;
        this.sessionId = sessionId;
        this.elementId = elementId;
        this.pageUrl = pageUrl;
    }

    /**
     * 우선순위 비교 로직
     * 1. Priority 우선 (HIGH > NORMAL)
     * 2. 같은 Priority면 timestamp 빠른 순
     */
    @Override
    public int compareTo(ProcessingRequest other) {
        // TODO: 개발자 C가 구체적인 우선순위 로직 구현
        int priorityComparison = this.priority.compareTo(other.priority);
        if (priorityComparison != 0) {
            return priorityComparison;
        }
        return this.timestamp.compareTo(other.timestamp);
    }

    /**
     * 요청 타입 열거형
     */
    public enum RequestType {
        IMAGE_ANALYSIS,  // 이미지 AI 분석
        TEXT_ANALYSIS    // 텍스트 AI 분석
    }

    /**
     * 처리 우선순위 열거형
     */
    public enum Priority {
        HIGH(1),         // 높은 우선순위 (뷰포트 내 컨텐츠)
        NORMAL(2);       // 일반 우선순위

        private final int level;

        Priority(int level) {
            this.level = level;
        }

        public int getLevel() {
            return level;
        }
    }
}