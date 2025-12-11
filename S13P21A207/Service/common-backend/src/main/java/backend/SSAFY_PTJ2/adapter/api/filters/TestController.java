package backend.SSAFY_PTJ2.adapter.api.filters;

import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageFilterSettings;
import backend.SSAFY_PTJ2.domain.common.service.SessionFilterService;
import backend.SSAFY_PTJ2.domain.textfilter.dto.TextFilterSettings;
import backend.SSAFY_PTJ2.infrastructure.ai.ImageAIWebClient;
import backend.SSAFY_PTJ2.infrastructure.ai.TextAIWebClient;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;


/**
// * 실시간으로 HealthCheck를 하기 위한 테스트 컨트롤러
 */

//@RestController
//@RequestMapping("/api/test")
//@RequiredArgsConstructor
public class TestController {

    private SessionFilterService sessionFilterService;
    private ImageAIWebClient imageAIWebClient;
    private TextAIWebClient textAIWebClient;

    @GetMapping("/filter/image/{sessionId}")
    public ImageFilterSettings getImageFilter(@PathVariable String sessionId) {
        return sessionFilterService.getImageFilterSettings(sessionId);
    }

    @GetMapping("/filter/text/{sessionId}")
    public TextFilterSettings getTextFilter(@PathVariable String sessionId) {
        return sessionFilterService.getTextFilterSettings(sessionId);
    }

    @GetMapping("/ai/status")
    public ResponseEntity<Map<String, Object>> checkAIContainerStatus() {
        Map<String, Object> status = new HashMap<>();

        // Image AI 상태 확인
        try {
            boolean imageHealthy = imageAIWebClient.health();
            status.put("imageAI", imageHealthy ? "RUNNING" : "NOT_AVAILABLE");
        } catch (Exception e) {
            status.put("imageAI", "NOT_AVAILABLE");
            status.put("imageAIError", e.getMessage());
        }

        // Text AI 상태 확인
        try {
            boolean textHealthy = textAIWebClient.health();
            status.put("textAI", textHealthy ? "RUNNING" : "NOT_AVAILABLE");
        } catch (Exception e) {
            status.put("textAI", "NOT_AVAILABLE");
            status.put("textAIError", e.getMessage());
        }

        return ResponseEntity.ok(status);
    }

    @GetMapping("/ai/image/health")
    public ResponseEntity<Map<String, String>> checkImageAIHealth() {
        Map<String, String> response = new HashMap<>();

        try {
            boolean healthy = imageAIWebClient.health();
            response.put("status", healthy ? "UP" : "DOWN");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("error", e.getMessage());
            return ResponseEntity.status(503).body(response);
        }
    }

    @GetMapping("/ai/text/health")
    public ResponseEntity<Map<String, String>> checkTextAIHealth() {
        Map<String, String> response = new HashMap<>();

        try {
            boolean healthy = textAIWebClient.health();
            response.put("status", healthy ? "UP" : "DOWN");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("error", e.getMessage());
            return ResponseEntity.status(503).body(response);
        }
    }
}
