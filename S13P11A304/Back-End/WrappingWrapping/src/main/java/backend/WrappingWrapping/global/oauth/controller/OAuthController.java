package backend.WrappingWrapping.global.oauth.controller;

import backend.WrappingWrapping.global.jwt.dto.TokenReissueRequest;
import backend.WrappingWrapping.global.jwt.dto.TokenResponse.TokenDto;
import backend.WrappingWrapping.global.oauth.dto.GoogleRequest;
import backend.WrappingWrapping.global.oauth.dto.GoogleResponse;
import backend.WrappingWrapping.global.oauth.dto.GoogleResponse.Join;
import backend.WrappingWrapping.global.oauth.dto.GoogleUserInfo;
import backend.WrappingWrapping.global.oauth.service.GoogleOAuthService;
import backend.WrappingWrapping.response.ApiResponse;
import backend.WrappingWrapping.response.status.ErrorStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/google")
@RequiredArgsConstructor
public class OAuthController {
    private final GoogleOAuthService googleOAuthService;

    @GetMapping("/login")
    public ApiResponse<String> getGoogleLoginUrl() {
        String url = googleOAuthService.getGoogleLoginUrl();
        return ApiResponse.onSuccess(url);
    }

    @PostMapping("/join")
    public ApiResponse<Join> signupFromGoogle(@RequestBody @Valid GoogleRequest.Join request) {
        Join response = googleOAuthService.joinFromGoogle(request);
        return ApiResponse.onSuccess(response);
    }


    @GetMapping("/callback")
    public ApiResponse<Object> googleCallback(@RequestParam String code) {
        GoogleResponse.Auth response = googleOAuthService.processGoogleLogin(code);

        if (response.getTokenDto() != null) {
            return ApiResponse.onSuccess(response.getTokenDto());
        }

        GoogleUserInfo userInfo = response.getUserInfo();
        if (userInfo == null || userInfo.getEmail() == null || userInfo.getName() == null) {
            return ApiResponse.onFailure(ErrorStatus.GOOGLE_USERINFO_FETCH_FAILED, null);
        }

        // 신규 유저인 경우 유저 정보 반환
        return ApiResponse.onFailure(
                ErrorStatus.MEMBER_NOT_REGISTERED_BY_GOOGLE,
                Map.of(
                        "email", response.getUserInfo().getEmail(),
                        "name", response.getUserInfo().getName()
                )
        );
    }

    @PostMapping("/reissue")
    public ApiResponse<TokenDto> reissue(@RequestBody TokenReissueRequest request) {
        return ApiResponse.onSuccess(googleOAuthService.reissueAccessToken(request));
    }

    @PostMapping("/logout")
    public ApiResponse<?> logout(HttpServletRequest request) {
        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            return ApiResponse.onFailure(ErrorStatus.INVALID_ACCESSTOKEN, "Authorization 헤더가 잘못되었습니다.");
        }

        String accessToken = header.replace("Bearer ", "");
        googleOAuthService.logout(accessToken);

        return ApiResponse.OK;
    }
}