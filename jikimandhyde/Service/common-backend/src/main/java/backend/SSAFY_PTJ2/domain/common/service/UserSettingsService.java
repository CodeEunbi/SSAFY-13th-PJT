package backend.SSAFY_PTJ2.domain.common.service;

import backend.SSAFY_PTJ2.domain.common.dto.UserSettings;

import java.util.Optional;

/**
 * 사용자 설정 서비스 인터페이스 - 개발자 A 담당
 *
 * Redis를 이용한 사용자별 개인 설정 관리를 담당합니다.
 * Socket.IO 설정 이벤트를 통해 저장된 설정을 조회하고 관리합니다.
 */
public interface UserSettingsService {

    /**
     * 사용자 설정 조회
     *
     * @param sessionId 사용자 세션 ID
     * @return 사용자 설정 (없으면 기본 설정 반환)
     */
    UserSettings getUserSettings(String sessionId);

    /**
     * 사용자 설정 저장/업데이트
     *
     * @param userSettings 저장할 사용자 설정
     */
    void saveUserSettings(UserSettings userSettings);

    /**
     * 특정 사용자 설정 삭제
     *
     * @param sessionId 삭제할 사용자 세션 ID
     */
    void deleteUserSettings(String sessionId);

    /**
     * 기본 설정 조회
     * 사용자가 설정을 하지 않은 경우 사용할 기본값들
     *
     * @return 기본 사용자 설정
     */
    UserSettings getDefaultSettings();

    /**
     * 설정 검증
     * 클라이언트에서 전송된 설정값들이 유효한지 검증
     *
     * @param userSettings 검증할 사용자 설정
     * @return 검증 결과 (true: 유효, false: 무효)
     */
    boolean validateSettings(UserSettings userSettings);

    /**
     * 사용자 설정 통계 조회 (관리자용)
     *
     * @return 설정 사용 통계
     */
    SettingsStatistics getSettingsStatistics();

    /**
     * 설정 통계 정보 DTO
     */
    record SettingsStatistics(
        long totalUsers,                  // 총 사용자 수
        double textFilterEnabledRatio,    // 텍스트 필터 활성화 비율
        double imageFilterEnabledRatio,   // 이미지 필터 활성화 비율
        double averageSensitivityLevel    // 평균 민감도 수준
    ) {}
}