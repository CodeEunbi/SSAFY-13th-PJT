package backend.SSAFY_PTJ2.adapter.api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Socket.IO settings-saved 이벤트에서 전송하는 설정 업데이트 완료 확인 응답 DTO
 */
@Data
@Builder
public class SettingsSavedDto {

    /**
     * 업데이트 상태 ("updated")
     */
    private String status;

    /**
     * 설정 업데이트 완료 시간
     */
    private String updatedAt;
}