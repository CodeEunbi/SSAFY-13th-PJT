package backend.SSAFY_PTJ2.adapter.api.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Socket.IO settings-update 이벤트에서 받는 사용자 설정 변경 요청 DTO
 */
@Data
public class SettingsUpdateDto {

    /**
     * 문서 타입 (항상 "settingsDoc")
     */
    private String type;

    /**
     * 사용자 설정 정보
     */
    private Settings settings;

    /**
     * 메타데이터 정보
     */
    private Meta __meta;

    @Data
    public static class Settings {

        /**
         * 서비스 활성화 여부
         */
        private boolean serviceEnabled;

        /**
         * 아이콘 표시 여부
         */
        private boolean showIcon;

        /**
         * 필터링 활성화 여부
         */
        private boolean filteringEnabled;

        /**
         * 필터링할 이미지 카테고리 목록
         * (비활성화 시 빈 배열)
         */
        private String[] filterImage;

        /**
         * 필터링할 텍스트 카테고리 목록
         * (비활성화 시 빈 배열)
         */
        private String[] filterText;
    }

    @Data
    public static class Meta {

        /**
         * 설정 업데이트 시간 (선택사항)
         */
        private LocalDateTime updatedAt;
    }
}