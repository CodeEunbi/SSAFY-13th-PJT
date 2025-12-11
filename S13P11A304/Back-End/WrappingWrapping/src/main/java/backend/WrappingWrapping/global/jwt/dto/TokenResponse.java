package backend.WrappingWrapping.global.jwt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class TokenResponse {
    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class TokenDto{
        private String accessToken;
        private String refreshToken;
    }
}

