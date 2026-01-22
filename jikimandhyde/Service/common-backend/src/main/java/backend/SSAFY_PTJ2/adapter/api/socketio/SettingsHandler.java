package backend.SSAFY_PTJ2.adapter.api.socketio;

import backend.SSAFY_PTJ2.domain.common.dto.UserSettingsDto;
import backend.SSAFY_PTJ2.domain.imagefilter.ImageLabels;
import backend.SSAFY_PTJ2.domain.imagefilter.service.SessionFilterService;
import backend.SSAFY_PTJ2.domain.textfilter.TextLabels;
import backend.SSAFY_PTJ2.global.response.exception.GeneralException;
import backend.SSAFY_PTJ2.global.response.status.ErrorStatus;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.DataListener;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
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
        DataListener<Object> onUserSettings = (client, data, ackSender) -> {
            String sessionId = client.getSessionId().toString();
            log.info("사용자 설정 수신: {} from {}", sessionId);

            try {
                // Jackson으로 자동 변환
                UserSettingsDto dto = objectMapper.convertValue(data, UserSettingsDto.class);

                // 이미지 필터 저장
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
                log.info("사용자 설정 저장 완료: {}", sessionId);

                // settings-saved 응답 전송
                client.sendEvent("settings-saved", createSuccessResponse("사용자 설정이 성공적으로 저장되었습니다."));

            } catch (Exception e) {
                log.error("사용자 설정 처리 중 오류 발생: {}", e.getMessage(), e);
                client.sendEvent("error", createErrorResponse("SV101", "설정 저장 실패"));
            }
        };

        socketIOServer.addEventListener("user-settings", Object.class, onUserSettings);
    }

    /**
     * settings-update 이벤트 리스너 등록
     * 사용자 설정 변경 요청
     */
    private void registerSettingsUpdateListener() {
        DataListener<Object> onSettingsUpdate = (client, data, ackSender) -> {
            log.info("설정 업데이트 요청: {} from {}", data, client.getSessionId());
            try {
                // TODO: 설정 업데이트 검증 및 처리 로직
                // - 변경할 설정 항목 검증
                // - 기존 설정과 병합
                // - 데이터베이스 업데이트

                validateSettingsUpdate(data);

                // 설정 업데이트 처리
                processSettingsUpdate(client.getSessionId().toString(), data);

                // settings-saved 응답 전송
                client.sendEvent("settings-saved", createSuccessResponse("설정이 성공적으로 업데이트되었습니다."));

                log.info("설정 업데이트 완료: {}", client.getSessionId());

            } catch (ValidationException e) {
                log.warn("설정 업데이트 검증 실패: {}", e.getMessage());
                client.sendEvent("error", createErrorResponse(e.getErrorCode(), e.getMessage()));
            } catch (Exception e) {
                log.error("설정 업데이트 처리 중 오류 발생: {}", e.getMessage(), e);
                client.sendEvent("error", createErrorResponse("SV102", "서버 과부하 및 점검"));
            }
        };

        socketIOServer.addEventListener("settings-update", Object.class, onSettingsUpdate);
    }

    /**
     * 사용자 설정 데이터 검증
     */
    private void validateUserSettings(Object data) {
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
    private void validateSettingsUpdate(Object data) {
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
    private void processUserSettings(String sessionId, Object data) {
        // TODO: 실제 설정 저장 로직 구현
        // - 데이터베이스에 사용자 설정 저장
        // - 캐시에 설정 정보 저장
        // - 세션별 설정 관리
    }

    /**
     * 설정 업데이트 처리
     */
    private void processSettingsUpdate(String sessionId, Object data) {
        // TODO: 실제 설정 업데이트 로직 구현
        // - 기존 설정과 새 설정 병합
        // - 데이터베이스 업데이트
        // - 캐시 갱신
    }

    /**
     * 성공 응답 객체 생성
     */
    private Object createSuccessResponse(String message) {
        return new SettingsResponse(true, message, null, System.currentTimeMillis());
    }

    /**
     * 에러 응답 객체 생성
     */
    private Object createErrorResponse(String errorCode, String message) {
        return new SettingsResponse(false, message, errorCode, System.currentTimeMillis());
    }

    /**
     * 설정 응답 DTO 클래스
     */
    private static class SettingsResponse {
        public final boolean success;
        public final String message;
        public final String errorCode;
        public final long timestamp;
        public final String category = "개인 설정";

        public SettingsResponse(boolean success, String message, String errorCode, long timestamp) {
            this.success = success;
            this.message = message;
            this.errorCode = errorCode;
            this.timestamp = timestamp;
        }
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