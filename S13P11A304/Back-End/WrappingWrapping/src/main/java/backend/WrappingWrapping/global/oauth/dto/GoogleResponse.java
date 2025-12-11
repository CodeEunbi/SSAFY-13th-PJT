package backend.WrappingWrapping.global.oauth.dto;

import backend.WrappingWrapping.global.jwt.dto.TokenResponse.TokenDto;
import lombok.Builder;
import lombok.Getter;

public class GoogleResponse {
    @Getter
    @Builder
    public static class Auth {
        private final GoogleUserInfo userInfo;
        private final TokenDto tokenDto;
    }

    public record Join(TokenDto tokenDto, String nickname) {}
}