package backend.SSAFY_PTJ2.adapter.api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Socket.IO settings-updated 이벤트에서 전송하는 설정 저장 완료 확인 응답 DTO
 */
@Data
@Builder
public class SettingsUpdatedDto {

    /**
     * 저장 상태 ("saved")
     */
    private String status;

    /**
     * 설정 적용 완료 시간
     */
    private String appliedAt;
}