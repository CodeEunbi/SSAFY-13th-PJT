package backend.SSAFY_PTJ2.adapter.api.socketio;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import backend.SSAFY_PTJ2.domain.common.service.SessionFilterService;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 기본 연결 관련 Socket.IO 이벤트 핸들러
 * - connection-init: 클라이언트 연결 초기화
 * - page-navigation: 페이지 이동 알림
 * - ping/pong: 연결 상태 확인
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ConnectionHandler {

    private final SocketIOServer socketIOServer;
    private final SessionFilterService sessionFilterService;

    @PostConstruct
    public void registerEventListeners() {
        registerConnectionListeners();
        registerConnectionInitListener();
        registerPageNavigationListener();
        registerPingPongListeners();
    }

    /**
     * 기본 연결/해제 리스너 등록
     */
    private void registerConnectionListeners() {
        ConnectListener onConnected = client -> {
            log.info("클라이언트 연결: {}", client.getSessionId());
            // 연결 확인만 로그, 실제 초기화는 connection-init 이벤트에서 처리
        };

        DisconnectListener onDisconnected = client -> {
            String sessionID = client.getSessionId().toString();

            // 이미지 필터 삭제
            sessionFilterService.deleteImageFilterSettings(sessionID);

            // 텍스트 필터 삭제
            sessionFilterService.deleteTextFilterSettings(sessionID);

            log.info("클라이언트 연결 해제: {}", client.getSessionId());
        };

        socketIOServer.addConnectListener(onConnected);
        socketIOServer.addDisconnectListener(onDisconnected);
    }

    /**
     * connection-init 이벤트 리스너 등록
     * 클라이언트 연결 초기화 및 사용자 인증
     */
    private void registerConnectionInitListener() {
        DataListener<Object> onConnectionInit = (client, data, ackSender) -> {
            log.info("연결 초기화 요청: {} from {}", data, client.getSessionId());
            try {
                // TODO: 실제 인증 로직 구현 필요
                // 사용자 인증 정보 검증, 세션 설정 등

                // connection-init-ok 응답 전송
                client.sendEvent("connection-init-ok", createSuccessResponse("연결이 성공적으로 초기화되었습니다."));
                log.info("연결 초기화 완료: {}", client.getSessionId());
            } catch (Exception e) {
                log.error("연결 초기화 중 오류 발생: {}", e.getMessage(), e);
                client.sendEvent("error", createErrorResponse("CL101", "연결 초기화 중 오류가 발생했습니다."));
            }
        };

        socketIOServer.addEventListener("connection-init", Object.class, onConnectionInit);
    }

    /**
     * page-navigation 이벤트 리스너 등록
     * 새로운 페이지로의 이동 알림
     */
    private void registerPageNavigationListener() {
        DataListener<Object> onPageNavigation = (client, data, ackSender) -> {
            log.info("페이지 이동 알림: {} from {}", data, client.getSessionId());
            try {
                // TODO: 페이지 컨텍스트 설정 로직 구현
                // 페이지별 필터링 설정, 컨텍스트 초기화 등

                log.info("페이지 네비게이션 처리 완료: {}", client.getSessionId());
            } catch (Exception e) {
                log.error("페이지 네비게이션 처리 중 오류 발생: {}", e.getMessage(), e);
                client.sendEvent("error", createErrorResponse("CL102", "유효하지 않은 URL입니다."));
            }
        };

        socketIOServer.addEventListener("page-navigation", Object.class, onPageNavigation);
    }

    /**
     * ping/pong 이벤트 리스너 등록
     * 연결 상태 확인을 위한 heartbeat
     */
    private void registerPingPongListeners() {
        DataListener<Object> onPing = (client, data, ackSender) -> {
            log.debug("Ping 수신: {} from {}", data, client.getSessionId());
            try {
                // pong 응답 전송
                client.sendEvent("pong", createSuccessResponse("pong"));
            } catch (Exception e) {
                log.error("Ping 처리 중 오류 발생: {}", e.getMessage(), e);
            }
        };

        socketIOServer.addEventListener("ping", Object.class, onPing);
    }

    /**
     * 성공 응답 객체 생성
     */
    private Object createSuccessResponse(String message) {
        return new Response(true, message, null);
    }

    /**
     * 에러 응답 객체 생성
     */
    private Object createErrorResponse(String errorCode, String message) {
        return new Response(false, message, errorCode);
    }

    /**
     * 응답 DTO 클래스
     */
    private static class Response {
        public final boolean success;
        public final String message;
        public final String errorCode;

        public Response(boolean success, String message, String errorCode) {
            this.success = success;
            this.message = message;
            this.errorCode = errorCode;
        }
    }
}