# =============================================================================
# Spring Boot 백엔드 서비스용 Dockerfile - 멀티스테이지 빌드
# =============================================================================

# Stage 1: 빌드 환경 (Gradle + JDK 17)
FROM gradle:8.9-jdk17-alpine AS builder

# 빌드용 작업 디렉토리 설정
WORKDIR /workspace

# 소스코드를 gradle 사용자 권한으로 복사 (보안 강화)
COPY --chown=gradle:gradle . .

# Gradle 빌드 실행 (데몬 비활성화로 메모리 효율성, 테스트 스킵으로 빌드 시간 단축)
RUN gradle --no-daemon bootJar -x test

# =============================================================================
# Stage 2: 런타임 환경 (JRE 21 Alpine)
# =============================================================================

# Eclipse Temurin JRE 17 Alpine 이미지 사용 (OpenJDK 권장 배포판)
FROM eclipse-temurin:17-jre-alpine

# 한국 시간대 설정을 위한 패키지 설치
# 시스템 시간을 한국 표준시로 설정
# 시간대 파일 생성
# 설치 후 패키지 삭제로 이미지 최적화
RUN apk add --no-cache tzdata curl && \
    cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
    echo "Asia/Seoul" > /etc/timezone && \
    apk del tzdata

# 보안을 위한 전용 사용자 생성 (root 권한으로 실행 방지)
RUN addgroup -S spring && adduser -S spring -G spring

# spring 사용자로 전환
USER spring:spring

# 애플리케이션 작업 디렉토리 설정
WORKDIR /app

# 빌드 스테이지에서 생성된 JAR 파일 복사
COPY --from=builder /workspace/build/libs/*.jar app.jar

# 빌드 스테이지에서 설정 파일들 복사 (환경별 application.yml)
COPY --from=builder /workspace/src/main/resources/application-*.yml ./

# Spring Boot 애플리케이션 포트 노출
EXPOSE 8080

# JVM 최적화 환경변수 설정 (컨테이너 환경 최적화)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -XX:MaxGCPauseMillis=200 \
               -Djava.security.egd=file:/dev/./urandom \
               -Dspring.profiles.active=production"

# 컨테이너 헬스체크 설정 (Spring Boot Actuator 활용)
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=60s \
            --retries=3 \
            CMD curl -f http://localhost:8080/actuator/health || exit 1

# Spring Boot 애플리케이션 실행
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
