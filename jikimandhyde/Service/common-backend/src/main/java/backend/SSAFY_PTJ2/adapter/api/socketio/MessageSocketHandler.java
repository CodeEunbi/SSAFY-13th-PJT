package backend.SSAFY_PTJ2.adapter.api.socketio;

/**
 * @deprecated
 * 이 클래스는 더 이상 사용되지 않습니다.
 * 기능이 카테고리별 핸들러로 분리되었습니다:
 * - ConnectionHandler: 기본 연결 관리
 * - TextFilterHandler: 텍스트 필터링
 * - ImageFilterHandler: 이미지 필터링
 * - SettingsHandler: 개인 설정
 *
 * Socket 서버 시작은 infrastructure.websocket.SocketIOServerManager에서 담당합니다.
 */
@Deprecated
public class MessageSocketHandler {
    // 이 클래스는 제거 예정입니다.
    // 새로운 카테고리별 핸들러를 사용해주세요.
}
