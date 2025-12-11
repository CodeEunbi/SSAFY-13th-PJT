1. GitLab 소스 클론 이후 빌드 및 배포 절차
    1) 사용 환경 정보
       - JVM: Oracle JDK 21

       - 웹 서버 / WAS: Spring Boot 3.2.5 (내장 Tomcat)

       - 웹 서버(Reverse Proxy): Nginx (HTTPS 인증서 및 리버스 프록시 구성)

       - IDE: IntelliJ IDEA

    2) 환경 변수 및 설정 값

        배포 시 application.yml 또는 .env 파일에 환경 변수를 지정합니다.
        민감한 값(API Key, 비밀번호 등)은 별도로 공유합니다.

        ``` yaml
        spring:
        datasource:
            driver-class-name: com.mysql.cj.jdbc.Driver
            url: jdbc:mysql://localhost:3306/pitchit?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
            username: root
            password: wrapping304
            hikari:
              maximum-pool-size: 10
              minimum-idle: 5
              idle-timeout: 600000
              max-lifetime: 1800000
              connection-timeout: 30000
        ```

    3) 배포 시 특이사항
       - 배포 환경: AWS EC2 (Ubuntu)

       - 컨테이너 구성:

           - spring 컨테이너 (포트 8080)

           - front 컨테이너 (포트 3000)

           - stt 컨테이너 (포트 8000, Whisper STT 서버)

       - Reverse Proxy: Nginx로 HTTPS 인증서 적용 및 /api 요청을 Spring Boot로 프록시 처리

    4) DB 연결 정보
       - DB 종류: MySQL

       - 계정 정보:

           - Host: localhost

           - Port: 3306

           - User: root

           - Password: wrapping304

           - Database: pitchit