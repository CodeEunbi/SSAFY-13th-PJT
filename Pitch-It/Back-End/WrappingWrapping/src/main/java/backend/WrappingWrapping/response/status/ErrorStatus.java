package backend.WrappingWrapping.response.status;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorStatus {
    /*
    Common
     */
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON500", "서버 에러, 관리자에게 문의 바랍니다."),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "COMMON400", "잘못된 요청입니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "COMMON401", "로그인 인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "COMMON403", "금지된 요청입니다."),

    /*
    Member
     */
    MEMBER_NOT_EXIST(HttpStatus.BAD_REQUEST, "MEMBER4000", "입력하신 회원이 존재하지 않습니다."),
    MEMBER_DUPLICATE_BY_EMAIL(HttpStatus.BAD_REQUEST, "MEMBER4001", "이메일이 중복됩니다."),
    MEMBER_NOT_REGISTERED_BY_GOOGLE(HttpStatus.BAD_REQUEST, "MEMBER4002", "신규 유저입니다. 회원가입이 필요합니다."),
    MEMBER_DUPLICATE_BY_NICKNAME(HttpStatus.BAD_REQUEST, "MEMBER4003", "닉네임이 중복됩니다."),
    /*
    Auth
     */
    INVALID_ACCESSTOKEN(HttpStatus.UNAUTHORIZED, "AUTH4010", "유효하지 않은 accessToken입니다."),
    GOOGLE_USERINFO_FETCH_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AUTH4011", "Google 사용자 정보를 가져오는 데 실패했습니다."),
    GOOGLE_TOKEN_RESPONSE_NULL(HttpStatus.INTERNAL_SERVER_ERROR, "AUTH4012", "Google 토큰 응답이 없습니다."),
    GOOGLE_ACCESS_TOKEN_NULL(HttpStatus.INTERNAL_SERVER_ERROR, "AUTH4013", "Google accessToken이 비어 있습니다."),
    GOOGLE_USERINFO_NULL(HttpStatus.INTERNAL_SERVER_ERROR, "AUTH4014", "Google 사용자 정보 응답이 비어 있습니다."),
    GOOGLE_USERINFO_INCOMPLETE(HttpStatus.INTERNAL_SERVER_ERROR, "AUTH4015", "Google 사용자 정보가 불완전합니다."),
    INVALID_REFRESHTOKEN(HttpStatus.FORBIDDEN, "AUTH4030", "유효하지 않은 refreshToken입니다."),
    /*
    Report
     */
    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "REPORT4040", "해당 리포트를 찾을 수 없습니다."),


    /*
    Reservation
     */
    RESERVATION_LIMITED(HttpStatus.BAD_REQUEST, "RESERVATION4004", "이미 3개의 미팅에 신청을 했습니다."),
    RESERVATION_TIME_DUPLICATED(HttpStatus.BAD_REQUEST, "RESERVATION4002", "이전에 예약한 미팅과 시간이 겹칩니다"),
    RESERVATION_NOT_FOUND(HttpStatus.BAD_REQUEST, "RESERVATION403", "회의를 찾지 못하였습니다."),
    OPPOSITE_NOT_FOUND(HttpStatus.BAD_REQUEST, "MEETING4001", "상대방을 찾지 못하였습니다."),
    NOT_RESERVATION_CREATOR(HttpStatus.BAD_REQUEST, "MEETING4005", "작성자만 삭제할 수 있습니다."),
    ORDER_NOT_DEFINE(HttpStatus.BAD_REQUEST, "MEETING4006", "아직 순서가 정해지지 않았습니다."),
    NOT_PARTICIPATING(HttpStatus.BAD_REQUEST, "MEETING4007", "해당 회의에 참가하고 있지 않습니다."),
    ALREADY_PARTICIPANT(HttpStatus.BAD_REQUEST, "MEETING4008", "이미 해당 회의에 참가하고 있습니다."),

    /*
    mail
     */
    MAIL_SEND_FAIL(HttpStatus.BAD_REQUEST, "MAIL4000", "메일 전송에 실패했습니다. "),

    /*
    Enums
     */
    MODE_TYPE_INVALID_DATA(HttpStatus.BAD_REQUEST, "MODE40001", "올바르지 않은 회의 모드입니다."),
    JOB_CATEGORY_INVALID_DATA(HttpStatus.BAD_REQUEST, "JOB40001", "올바르지 않은 직업 구분입니다."),

    /*
    OpenAI
     */
    OPENAI_RESPONSE_PARSING_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "OPENAI5001", "OpenAI 응답 파싱에 실패했습니다."),
    OPENAI_EMPTY_RESPONSE(HttpStatus.INTERNAL_SERVER_ERROR, "OPENAI5002", "OpenAI 응답이 비어 있습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
