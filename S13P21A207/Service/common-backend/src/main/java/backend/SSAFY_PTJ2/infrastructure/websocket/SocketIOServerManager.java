package backend.SSAFY_PTJ2.infrastructure.websocket;

import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Socket.IO 서버 관리 및 시작 담당 컴포넌트
 * 애플리케이션 시작 시 Socket.IO 서버를 자동으로 시작하고 생명주기를 관리
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SocketIOServerManager implements CommandLineRunner {

    private final SocketIOServer socketIOServer;

    /**
     * 애플리케이션 시작 시 Socket.IO 서버 시작
     * 모든 이벤트 핸들러들이 @PostConstruct에서 리스너를 등록한 후에 서버를 시작
     */
    @Override
    public void run(String... args) throws Exception {
        log.info("Socket.IO 서버를 시작합니다...");

        try {
            // Socket.IO 서버 시작
            socketIOServer.start();

            log.info("Socket.IO 서버가 성공적으로 시작되었습니다.");
            log.info("Host: {}", socketIOServer.getConfiguration().getHostname());
            log.info("Port: {}", socketIOServer.getConfiguration().getPort());
            log.info("등록된 이벤트 네임스페이스: {}", socketIOServer.getAllNamespaces().size());

        } catch (Exception e) {
            log.error("Socket.IO 서버 시작 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("Socket.IO 서버 시작 실패", e);
        }

        // JVM 종료 시 서버 정리
        Runtime.getRuntime().addShutdownHook(new Thread(this::stopServer));
    }

    /**
     * Socket.IO 서버 정리 및 종료
     */
    private void stopServer() {
        if (socketIOServer != null) {
            log.info("Socket.IO 서버를 종료합니다...");
            socketIOServer.stop();
            log.info("Socket.IO 서버가 종료되었습니다.");
        }
    }

    /**
     * 서버 상태 확인
     */
    public boolean isServerRunning() {
        return socketIOServer != null && socketIOServer.getAllClients().size() >= 0;
    }

    /**
     * 현재 연결된 클라이언트 수 반환
     */
    public int getConnectedClientCount() {
        return socketIOServer != null ? socketIOServer.getAllClients().size() : 0;
    }
}