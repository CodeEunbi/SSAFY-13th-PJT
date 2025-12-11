package backend.SSAFY_PTJ2.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@Getter @Setter
@ConfigurationProperties(prefix = "ai")
public class AIClientProperties {
    private Endpoint image = new Endpoint();
    private Endpoint text = new Endpoint();
    private TimeoutMs timeoutMs = new TimeoutMs();
    private Retry retry = new Retry();
    private Upload upload = new Upload();

    @Getter @Setter
    public static class Endpoint {
        private String baseUrl;
    }

    @Getter @Setter
    public static class TimeoutMs {
        private int connect = 15000000;
        private int read = 25000000;
        private int write = 2500000;
    }

    @Getter @Setter
    public static class Retry {
        private int maxAttempts = 3;
        private long backoffMs = 200;
        private double jitter = 0.3;
    }

    @Getter @Setter
    public static class Upload {
        private long maxBytes = 10 * 1024 * 1024;

    }
}
