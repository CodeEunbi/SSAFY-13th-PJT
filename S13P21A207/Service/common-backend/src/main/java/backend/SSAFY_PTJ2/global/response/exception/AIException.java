package backend.SSAFY_PTJ2.global.response.exception;
/**
 * AI 통신 공통 예외 계층
 */
public class AIException extends RuntimeException {
    public AIException(String message) { super(message); }
    public AIException(String message, Throwable cause) { super(message, cause); }

    // --- 하위 예외들 ---

    /** 잘못된 요청 (클라이언트 측 오류, 4xx) */
    public static class ClientException extends AIException {
        public ClientException(String message) { super(message); }
        public ClientException(String message, Throwable cause) { super(message, cause); }
    }

    /** 서버 오류 (AI 컨테이너 내부 오류, 5xx) */
    public static class ServerException extends AIException {
        public ServerException(String message) { super(message); }
        public ServerException(String message, Throwable cause) { super(message, cause); }
    }

    /** 네트워크/타임아웃 오류 */
    public static class TransportException extends AIException {
        public TransportException(String message) { super(message); }
        public TransportException(String message, Throwable cause) { super(message, cause); }
    }

    /** 업로드한 이미지 자체가 잘못된 경우 */
    public static class InvalidImageException extends AIException {
        public InvalidImageException(String message) { super(message); }
    }

    /** 업로드 용량 제한 초과 */
    public static class UploadTooLargeException extends AIException {
        public UploadTooLargeException(String message) { super(message); }
    }
}