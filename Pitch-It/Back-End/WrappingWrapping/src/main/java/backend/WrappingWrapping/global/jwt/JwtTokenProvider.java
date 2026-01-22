package backend.WrappingWrapping.global.jwt;

import backend.WrappingWrapping.global.jwt.dto.TokenResponse.TokenDto;
import backend.WrappingWrapping.response.exception.GeneralException;
import backend.WrappingWrapping.response.status.ErrorStatus;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.access-token-validity}")
    private long accessTokenValidTime;

    @Value("${jwt.refresh-token-validity}")
    private long refreshTokenValidTime;

    private final RedisTemplate<String, String> redisTemplate;

    public TokenDto generateToken(Long userId) {
        String accessToken = createToken(userId, accessTokenValidTime);
        String refreshToken = createToken(userId, refreshTokenValidTime);

        // Redis에 refreshToken 저장 (key: refresh:{userId})
        redisTemplate.opsForValue().set(
                "refresh:" + userId,
                refreshToken,
                refreshTokenValidTime,
                TimeUnit.MILLISECONDS
        );

        return TokenDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public TokenDto reissue(String refreshToken) {
        Long userId = getUserIdFromAnyToken(refreshToken);
        String stored = redisTemplate.opsForValue().get("refresh:" + userId);

        if (stored == null || !stored.equals(refreshToken)) {
            throw new GeneralException(ErrorStatus.INVALID_REFRESHTOKEN);
        }

        return generateToken(userId);
    }

    public void logout(String accessToken) {
        Long userId = getUserIdFromToken(accessToken);
        Date expiration = getTokenExpiration(accessToken);

        // 블랙리스트 처리 (accessToken 무효화)
        redisTemplate.opsForValue().set(
                "blacklist:" + accessToken,
                "logout",
                expiration.getTime() - System.currentTimeMillis(),
                TimeUnit.MILLISECONDS
        );

        // refreshToken 삭제
        redisTemplate.delete("refresh:" + userId);
    }

    private String createToken(Long userId, long validity) {
        Claims claims = Jwts.claims().setSubject(String.valueOf(userId));
        Date now = new Date();

        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        Key key = Keys.hmacShaKeyFor(keyBytes);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + validity))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Long getUserIdFromAnyToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(secretKey.getBytes())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return Long.valueOf(claims.getSubject());
        } catch (ExpiredJwtException e) {
            return Long.valueOf(e.getClaims().getSubject());
        }
    }


    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey.getBytes())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return Long.valueOf(claims.getSubject());
    }

    public Date getTokenExpiration(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey.getBytes())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
    }

    public String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
