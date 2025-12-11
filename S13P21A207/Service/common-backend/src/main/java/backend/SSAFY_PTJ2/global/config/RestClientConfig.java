package backend.SSAFY_PTJ2.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * REST 클라이언트 설정 클래스
 * FastAPI Docker 컨테이너와의 HTTP 통신을 위한 설정
 */
@Configuration
public class RestClientConfig {

    /**
     * RestTemplate Bean 생성
     * Docker 컨테이너의 FastAPI 서버와 HTTP 통신용
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}