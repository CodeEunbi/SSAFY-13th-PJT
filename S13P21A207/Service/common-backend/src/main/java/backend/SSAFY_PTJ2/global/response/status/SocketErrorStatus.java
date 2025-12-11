package backend.SSAFY_PTJ2.global.response.status;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SocketErrorStatus {
	USER_SETTING_VALIDATION_FAIL("SO101", "설정 포맷이 맞지 않습니다."),
	USER_SETTING_UPDATE_FAIL("SO102", "사용자 설정 업데이트 중 서버 내부 오류 발생하였습니다.")
	;
	private final String code;
	private final String message;
}
