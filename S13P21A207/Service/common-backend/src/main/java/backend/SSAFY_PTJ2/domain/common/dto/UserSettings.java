package backend.SSAFY_PTJ2.domain.common.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

/**
 * 사용자 개인 설정 DTO
 * Redis에 저장되는 사용자별 필터링 설정 정보
 */
@Getter
@Builder
public class UserSettings {

    /**
     * 사용자 세션 ID
     */
    private final String sessionId;

    /**
     * 텍스트 필터링 설정
     */
    private final TextFilterSettings textFilterSettings;

    /**
     * 이미지 필터링 설정
     */
    private final ImageFilterSettings imageFilterSettings;

    /**
     * 알림 설정
     */
    private final NotificationSettings notificationSettings;

    /**
     * 설정 버전 (설정 변경 추적용)
     */
    private final int version;

    /**
     * 확장 가능한 추가 설정들
     */
    private final Map<String, Object> additionalSettings;

    /**
     * 텍스트 필터링 세부 설정
     */
    @Getter
    @Builder
    public static class TextFilterSettings {
        private final boolean enabled;                    // 텍스트 필터링 활성화 여부
        private final double sensitivityLevel;            // 민감도 수준 (0.0 ~ 1.0)
        private final List<String> enabledCategories;     // 활성화된 혐오 카테고리들
        private final boolean showWarningMessage;         // 경고 메시지 표시 여부
        private final String replacementText;             // 대체 텍스트 (비워두면 가리기)
    }

    /**
     * 이미지 필터링 세부 설정
     */
    @Getter
    @Builder
    public static class ImageFilterSettings {
        private final boolean enabled;                    // 이미지 필터링 활성화 여부
        private final double sensitivityLevel;            // 민감도 수준 (0.0 ~ 1.0)
        private final List<String> enabledCategories;     // 활성화된 혐오 카테고리들
        private final boolean blurInsteadOfHide;         // 숨김 대신 블러 처리 여부
        private final String overlayMessage;             // 가려진 이미지에 표시할 메시지
    }

    /**
     * 알림 세부 설정
     */
    @Getter
    @Builder
    public static class NotificationSettings {
        private final boolean showFilterCount;           // 필터링된 컨텐츠 수 표시
        private final boolean soundAlert;               // 소리 알림
        private final boolean desktopNotification;      // 데스크톱 알림
    }
}