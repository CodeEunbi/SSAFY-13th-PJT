package backend.SSAFY_PTJ2.global.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.netty.http.client.HttpClient;
import reactor.core.publisher.Mono;

/**
 * AI 서버 호출용 WebClient를 생성, 설정해서 빈으로 등록
 */
@Configuration
@EnableConfigurationProperties(AIClientProperties.class)
public class WebClientConfig {

    @Bean
    public WebClient imageWebClient(AIClientProperties props) {
        return baseWebClient(props.getImage().getBaseUrl(), props);
    }

    @Bean
    public WebClient textWebClient(AIClientProperties props) {
        return baseWebClient(props.getText().getBaseUrl(), props);
    }

    private WebClient baseWebClient(String baseUrl, AIClientProperties props) {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, props.getTimeoutMs().getConnect())
                .responseTimeout(Duration.ofMillis(props.getTimeoutMs().getRead()));

        // 강화된 로깅: 요청/응답
        ExchangeFilterFunction enhancedLog = ExchangeFilterFunction.ofRequestProcessor(req -> {
            long startTime = System.currentTimeMillis();
            System.out.println("[AI-REQ] " + req.method() + " " + req.url() + " at " + startTime);
            return Mono.just(req);
        }).andThen(ExchangeFilterFunction.ofResponseProcessor(res -> {
            long endTime = System.currentTimeMillis();
            System.out.println("[AI-RES] " + res.statusCode() + " completed at " + endTime);
            return Mono.just(res);
        }));

        return WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .filter(enhancedLog)
                .build();
    }
}
