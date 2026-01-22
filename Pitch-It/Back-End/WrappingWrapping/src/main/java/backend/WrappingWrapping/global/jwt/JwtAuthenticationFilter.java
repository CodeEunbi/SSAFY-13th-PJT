package backend.WrappingWrapping.global.jwt;

import backend.WrappingWrapping.global.auth.CustomUserDetailsService;
import backend.WrappingWrapping.response.exception.GeneralException;
import backend.WrappingWrapping.response.status.ErrorStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, String> redisTemplate;
    private final CustomUserDetailsService userDetailsService;

    // 인증 예외 경로
    private static final List<String> EXCLUDE_URL_PATTERN_LIST = List.of(
            "/login",
            "/css",
            "/js",
            "/ws",
            "/token",
            "/auth",
            "/api/v1/users/join",
            "/api/v1/auth/google",
            "/api/v1/auth/google/login",
            "/api/v1/auth/google/callback",
            "/api/v1/subject"
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        if (!path.startsWith("/api/")) {
            return true;
        }
        return EXCLUDE_URL_PATTERN_LIST.stream()
                .anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Authorization 헤더에서 JWT 토큰 추출
        String token = jwtTokenProvider.getTokenFromRequest(request);

        // 2. 토큰이 없는 경우 -> 401 반환
        if (token == null) {
            throw new GeneralException(ErrorStatus.UNAUTHORIZED);
        }

        // 3. 블랙리스트에 등록된 토큰인 경우
        if (isTokenBlacklisted(token)) {
            throw new GeneralException(ErrorStatus.INVALID_ACCESSTOKEN);
        }

        // 4. 토큰 검증 및 인증 정보 설정
        try {
            // JWT 토큰에서 사용자 ID 추출
            Long userId = jwtTokenProvider.getUserIdFromToken(token);

            if (userId != null) {
                // UserDetailsService를 통해 사용자 정보 로드
                UserDetails userDetails = userDetailsService.loadUserByUsername(userId.toString());

                // Spring Security에 인증 정보 설정
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                log.warn("userId가 null 입니다.");
            }
        } catch (Exception e) {
            log.warn("JWT 토큰 검증 실패: " + e.getMessage()); // 토큰이 유효하지 않으면 무시 (인증되지 않은 상태로 진행)
        }

        filterChain.doFilter(request, response);
    }

    private boolean isTokenBlacklisted(String token) {
        return redisTemplate.hasKey("blacklist:" + token);
    }
}