package backend.WrappingWrapping.global.openai;

import backend.WrappingWrapping.global.openai.dto.OpenAiRequest;
import backend.WrappingWrapping.response.exception.GeneralException;
import backend.WrappingWrapping.response.status.ErrorStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
@RequiredArgsConstructor
public class OpenAiClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.model}")
    private String model;

    public String sendChatRequest(String prompt) {
        String url = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 객체로 요청 바디 구성
        OpenAiRequest requestBody = new OpenAiRequest(
                model,
                List.of(
                        new OpenAiRequest.Message("developer", "너는 실제 기업의 면접관이다."),
                        new OpenAiRequest.Message("user", prompt)
                ),
                0.7
        );

        try {
            String json = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(json, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );
            return response.getBody();
        } catch (Exception e) {
            throw new GeneralException(ErrorStatus.INTERNAL_SERVER_ERROR, "OpenAI API 호출 실패", e);
        }
    }
}
