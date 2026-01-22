package backend.WrappingWrapping.global.oauth.service;

import backend.WrappingWrapping.domain.member.RoleType;
import backend.WrappingWrapping.domain.member.User;
import backend.WrappingWrapping.domain.member.repository.UserRepository;
import backend.WrappingWrapping.global.jwt.JwtTokenProvider;
import backend.WrappingWrapping.global.jwt.dto.TokenReissueRequest;
import backend.WrappingWrapping.global.jwt.dto.TokenResponse.TokenDto;
import backend.WrappingWrapping.global.oauth.dto.GoogleRequest;
import backend.WrappingWrapping.global.oauth.dto.GoogleResponse;
import backend.WrappingWrapping.global.oauth.dto.GoogleTokenResponse;
import backend.WrappingWrapping.global.oauth.dto.GoogleUserInfo;
import backend.WrappingWrapping.response.exception.GeneralException;
import backend.WrappingWrapping.response.status.ErrorStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
public class GoogleOAuthService {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String GOOGLE_CLIENT_ID;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String GOOGLE_CLIENT_SECRET;

    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    private String REDIRECT_URI;

    private final RestTemplate restTemplate;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public String getGoogleLoginUrl() {
        return UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", GOOGLE_CLIENT_ID)
                .queryParam("redirect_uri", REDIRECT_URI)
                .queryParam("response_type", "code")
                .queryParam("scope", "email profile")
                .queryParam("access_type", "offline") // refreshToken 발급
                .build().toUriString();
    }

    private GoogleTokenResponse requestAccessToken(String code) {
        String tokenRequestUrl = "https://oauth2.googleapis.com/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", GOOGLE_CLIENT_ID);
        params.add("client_secret", GOOGLE_CLIENT_SECRET);
        params.add("redirect_uri", REDIRECT_URI);
        params.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        return restTemplate.postForObject(tokenRequestUrl, request, GoogleTokenResponse.class);
    }


    private GoogleUserInfo requestUserInfo(String accessToken) {
        String userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<GoogleUserInfo> response = restTemplate.exchange(
                userInfoUrl,
                HttpMethod.GET,
                request,
                GoogleUserInfo.class
        );

        return response.getBody();
    }


    public GoogleResponse.Auth processGoogleLogin(String code) {
        // 1. code -> accessToken 받기
        GoogleTokenResponse tokenResponse = requestAccessToken(code);

        if (tokenResponse == null) {
            throw new GeneralException(ErrorStatus.GOOGLE_TOKEN_RESPONSE_NULL);
        }
        if (tokenResponse.getAccessToken() == null) {
            throw new GeneralException(ErrorStatus.GOOGLE_ACCESS_TOKEN_NULL);
        }

        // 2. accessToken -> 유저 정보 받기
        GoogleUserInfo userInfo = requestUserInfo(tokenResponse.getAccessToken());

        if (userInfo == null) {
            throw new GeneralException(ErrorStatus.GOOGLE_USERINFO_NULL);
        }
        if (userInfo.getEmail() == null || userInfo.getName() == null) {
            throw new GeneralException(ErrorStatus.GOOGLE_USERINFO_INCOMPLETE);
        }

        return userRepository.findByEmail(userInfo.getEmail())
                .map(user -> GoogleResponse.Auth.builder()
                        .userInfo(userInfo)
                        .tokenDto(jwtTokenProvider.generateToken(user.getId()))
                        .build())
                .orElse(GoogleResponse.Auth.builder()
                        .userInfo(userInfo)
                        .tokenDto(null)
                        .build());
    }

    public TokenDto reissueAccessToken(TokenReissueRequest request) {
        return jwtTokenProvider.reissue(request.getRefreshToken());
    }

    public void logout(String accessToken) {
        jwtTokenProvider.logout(accessToken);
    }

    @Transactional
    public GoogleResponse.Join joinFromGoogle(GoogleRequest.Join request) {
        validateDuplicate(request); // 입력값 중복 검사
        User user = createUser(request); // 유저 객체 생성
        TokenDto tokenDto = jwtTokenProvider.generateToken(user.getId()); // 토큰 발급
        return new GoogleResponse.Join(tokenDto, user.getNickname());
    }

    private void validateDuplicate(GoogleRequest.Join request) {
        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new GeneralException(ErrorStatus.MEMBER_DUPLICATE_BY_EMAIL);
        }

        // 닉네임 중복 체크
        if (userRepository.existsByNickname(request.getNickname())) {
            throw new GeneralException(ErrorStatus.MEMBER_DUPLICATE_BY_NICKNAME);
        }
    }

    private User createUser(GoogleRequest.Join request) {
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .nickname(request.getNickname())
                .role(RoleType.ROLE_USER)
                .build();
        return userRepository.save(user);
    }
}
