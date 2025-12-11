package backend.SSAFY_PTJ2.global;

/**
 * @deprecated
 * 이 클래스는 더 이상 사용되지 않습니다.
 * Socket.IO 서버 시작 로직이 infrastructure.websocket.SocketIOServerManager로 이동되었습니다.
 *
 * 새로운 구조:
 * - SocketIOServerManager: 서버 생명주기 관리
 * - 카테고리별 핸들러들: @PostConstruct에서 이벤트 리스너 등록
 * - 서버 시작: 모든 핸들러 등록 후 SocketIOServerManager에서 시작
 */
@Deprecated
public class SocketIOServerRunner {
    // 이 클래스는 제거 예정입니다.
    // infrastructure.websocket.SocketIOServerManager를 사용해주세요.
}