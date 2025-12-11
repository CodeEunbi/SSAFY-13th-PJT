package backend.SSAFY_PTJ2.global.config;

import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Socket.IO 서버 설정 클래스
 * 익스텐션과의 실시간 통신을 위한 Socket.IO 서버 구성
 */
@Configuration
public class SocketIOConfig {

    @Value("${socketio.server.host:localhost}")
    private String host;

    @Value("${socketio.server.port:9092}")
    private Integer port;

    /**
     * Socket.IO 서버 Bean 생성
     * CORS 설정 및 기본 서버 옵션 구성
     */
    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname(host);
        config.setPort(port);

        // CORS 설정 - 익스텐션에서의 접근 허용
        config.setOrigin("*");

        // 연결 타임아웃 설정
        config.setPingTimeout(60000);
        config.setPingInterval(25000);

        // WebSocket 프레임 크기 제한 증가 (기본 64KB -> 1MB)
        config.setMaxFramePayloadLength(1024 * 1024); // 1MB
        config.setMaxHttpContentLength(1024 * 1024);   // HTTP 요청도 1MB로 증가

        return new SocketIOServer(config);
    }
}
