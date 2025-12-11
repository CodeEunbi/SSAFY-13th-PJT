package backend.WrappingWrapping.global.openai.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@AllArgsConstructor
@Getter
public class OpenAiRequest {
    private String model;
    private List<Message> messages;
    private Double temperature;

    @AllArgsConstructor
    @Getter
    public static class Message {
        private String role;
        private String content;
    }
}
