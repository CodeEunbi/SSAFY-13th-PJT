package backend.SSAFY_PTJ2.adapter.api.socketio;

import backend.SSAFY_PTJ2.adapter.api.dto.ErrorSocketDto;
import backend.SSAFY_PTJ2.adapter.api.dto.SettingsSavedDto;
import backend.SSAFY_PTJ2.adapter.api.dto.SettingsUpdatedDto;
import backend.SSAFY_PTJ2.application.ProcessingOrchestrator;
import backend.SSAFY_PTJ2.domain.common.dto.UserSettingsDto;
import backend.SSAFY_PTJ2.domain.imagefilter.ImageLabels;
import backend.SSAFY_PTJ2.domain.common.service.SessionFilterService;
import backend.SSAFY_PTJ2.domain.textfilter.TextLabels;
import backend.SSAFY_PTJ2.infrastructure.cache.RedisUserSettingsService;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.DataListener;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import backend.SSAFY_PTJ2.global.response.status.SocketErrorStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

/**
 * 개인 설정 관련 Socket.IO 이벤트 핸들러
 * - user-settings: 사용자 개인 필터링 설정 전송
 * - settings-update: 사용자 설정 변경 요청
 * - settings-saved: 설정 업데이트 완료 확인 응답 (자동 전송)
 * - settings-updated: 설정 저장 완료 확인 응답 (자동 전송)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SettingsHandler {

    private final SocketIOServer socketIOServer;
    private final SessionFilterService sessionFilterService;
    private final ObjectMapper objectMapper;
    private final ProcessingOrchestrator processingOrchestrator;
    private final RedisUserSettingsService redisUserSettingsService;

    @PostConstruct
    public void registerEventListeners() {
        registerUserSettingsListener();
        registerSettingsUpdateListener();
    }

    /**
     * user-settings 이벤트 리스너 등록
     * 사용자 개인 필터링 설정 전송
     */
    private void registerUserSettingsListener() {
        DataListener<UserSettingsDto> onUserSettings = (client, dto, ackSender) -> {
            String sessionId = client.getSessionId().toString();
            log.info("사용자 설정 수신: {} from {}", dto, sessionId);

            try {
                // // Jackson으로 자동 변환
                // UserSettingsDto dto = objectMapper.convertValue(data, UserSettingsDto.class);

                // 추후 값 자체에 대한 확인 필요
                // validateUserSettings(dto);

                processUserSettings(sessionId, dto);

                // settings-saved 응답 전송
                client.sendEvent("settings-saved",
                    SettingsSavedDto.builder()
                        .updatedAt(LocalDateTime.now().toString()) // 추후 저장소에 저장된 시각을 처리하는 것이 좋음
                        .status("updated")
                        .build()
                );

            } catch (Exception e) {
                log.error("사용자 설정 처리 중 오류 발생: {}", e.getMessage(), e);
                client.sendEvent("error", createErrorResponse(SocketErrorStatus.USER_SETTING_UPDATE_FAIL));
            }
        };

        socketIOServer.addEventListener("user-settings", UserSettingsDto.class, onUserSettings);
    }

    /**
     * settings-update 이벤트 리스너 등록
     * 사용자 설정 변경 요청
     */
    private void registerSettingsUpdateListener() {
        DataListener<UserSettingsDto> onSettingsUpdate = (client, dto, ackSender) -> {
            String sessionId = client.getSessionId().toString();
            log.info("설정 업데이트 요청: {} from {}", dto, client.getSessionId());
            try {

                processSettingsUpdate(sessionId, dto);

                // settings-saved 응답 전송
                client.sendEvent("setting-updated",
                    SettingsUpdatedDto.builder()
                        .status("saved")
                        .appliedAt(LocalDateTime.now().toString()) // 추후 저장소에 저장되었을 시각으로 변경해야함
                    );

                log.info("설정 업데이트 완료: {}", client.getSessionId());
                client.sendEvent("settings-updated",
                    SettingsUpdatedDto.builder()
                        .appliedAt(LocalDateTime.now().toString())
                        .status("updated")
                        .build());
            } catch (ValidationException e) {
                log.warn("설정 업데이트 검증 실패: {}", e.getMessage());
                client.sendEvent("error", createErrorResponse(SocketErrorStatus.USER_SETTING_VALIDATION_FAIL));
            } catch (Exception e) {
                log.error("설정 업데이트 처리 중 오류 발생: {}", e.getMessage(), e);
                client.sendEvent("error", createErrorResponse(SocketErrorStatus.USER_SETTING_UPDATE_FAIL));
            }
        };

        socketIOServer.addEventListener("settings-update", UserSettingsDto.class, onSettingsUpdate);
    }

    private ErrorSocketDto createErrorResponse(SocketErrorStatus errorStatus) {
        return ErrorSocketDto.builder()
            .isError(true)
            .errorCode(errorStatus.getCode())
            .message(errorStatus.getMessage())
            .build();
    }

    /**
     * 사용자 설정 데이터 검증
     */
    private void validateUserSettings(UserSettingsDto data) {
        if (data == null) {
            throw new ValidationException("CL101", "필수필드 누락 및 잘못된 JSON 형식");
        }

        // TODO: 추가 검증 로직 구현
        // - 필터링 강도 값 범위 확인
        // - 카테고리 설정 유효성 확인
        // - 알림 설정 값 확인
    }

    /**
     * 설정 업데이트 데이터 검증
     */
    private void validateSettingsUpdate(UserSettingsDto data) {
        if (data == null) {
            throw new ValidationException("CL101", "필수필드 누락 및 잘못된 JSON 형식");
        }

        // TODO: 추가 검증 로직 구현
        // - 업데이트할 설정 필드 확인
        // - 설정 값 유효성 검증
    }

    /**
     * 사용자 설정 처리
     */
    private void processUserSettings(String sessionId, UserSettingsDto dto) {
        if (dto.getSettings().getFilterImage() != null
            && dto.getSettings().getFilterImage().getCategories() != null) {

            Set<ImageLabels> imageFilters = new HashSet<>(
                dto.getSettings().getFilterImage().getCategories()
            );
            boolean originalViewEnabled = dto.getSettings().getFilterImage().isOriginalViewEnabled();

            sessionFilterService.saveImageFilterSettings(sessionId, imageFilters, originalViewEnabled);
        }

        // 텍스트 필터 저장
        if (dto.getSettings().getFilterText() != null
            && dto.getSettings().getFilterText().getCategories() != null) {

            Set<TextLabels> textFilters = new HashSet<>(
                dto.getSettings().getFilterText().getCategories()
            );
            boolean originalViewEnabled = dto.getSettings().getFilterText().isOriginalViewEnabled();

            sessionFilterService.saveTextFilterSettings(sessionId, textFilters, originalViewEnabled);
        }

        // Redis 통합 설정 저장
        redisUserSettingsService.saveUserSettingsFromDto(sessionId, dto);

        log.info("사용자 설정 저장 완료: {}", sessionId);
    }

    /**
     * 설정 업데이트 처리
     */
    private void processSettingsUpdate(String sessionId, UserSettingsDto dto) {
        //업데이트도 설정과 동일. 어차피 업데이트할때에도 모든 설정을 다 보내온다.
        processUserSettings(sessionId, dto);
    }


    /**
     * 검증 예외 클래스
     */
    private static class ValidationException extends RuntimeException {
        private final String errorCode;

        public ValidationException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }

}