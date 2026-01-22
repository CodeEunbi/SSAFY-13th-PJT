package backend.WrappingWrapping.global.subject.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public abstract class SubjectResponse {
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenerateResult {
        private String situation;
        private String requirements;
        private String question;
    }
}
