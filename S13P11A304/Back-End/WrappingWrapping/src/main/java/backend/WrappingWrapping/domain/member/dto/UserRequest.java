package backend.WrappingWrapping.domain.member.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

public abstract class UserRequest {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class updateDTO {
        @NotNull
        private String nickname;
    }
}
