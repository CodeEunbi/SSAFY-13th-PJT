package backend.SSAFY_PTJ2.global.response.status;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorStatus {
    /**
     * Common
     */
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "서버 에러, 관리자에게 문의 바랍니다."),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "COMMON400", "잘못된 요청입니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "COMMON401", "로그인 인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "COMMON403", "금지된 요청입니다."),

    /**
     * Client Errors
     */
    INVALID_JSON_FORMAT(HttpStatus.BAD_REQUEST, "CL101", "잘못된 요청 형식입니다."),
    INVALID_URL(HttpStatus.BAD_REQUEST, "CL102", "유효하지 않은 URL입니다."),
    REQUEST_LIMIT_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "CL103", "요청한도를 초과했습니다."),
    TEXT_LENGTH_EXCEEDED(HttpStatus.BAD_REQUEST, "CL104", "텍스트길이가 제한을 초과했습니다."),
    TEXT_ARRAY_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "CL105", "처리 가능한 텍스트 요소 개수를 초과했습니다."),

    /**
     * Server Errors
     */
    EXTERNAL_SERVICE_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "SV101", "외부 서비스 연결에 실패했습니다."),
    SERVER_OVERLOADED(HttpStatus.SERVICE_UNAVAILABLE, "SV102", "서비스를 일시적으로 사용할 수 없습니다."),
    SERVER_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "SV103", "서버 응답 시간이 초과되었습니다."),

    /**
     * AI Errors
     */
    TEXT_CLASSIFICATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AI101", "텍스트 분류 처리 중 오류가 발생했습니다."),
    TEXT_CLASSIFICATION_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "AI102", "텍스트 분류 처리 시간이 초과되었습니다."),
    TEXT_PURIFICATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AI201", "텍스트 순화 처리 중 오류가 발생했습니다."),
    TEXT_PURIFICATION_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "AI202", "텍스트 순화 처리 시간이 초과되었습니다."),
    IMAGE_ANALYSIS_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AI301", "이미지 분석 중 오류가 발생했습니다."),
    IMAGE_ANALYSIS_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "AI302","요청 처리 시간이 초과되었습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}