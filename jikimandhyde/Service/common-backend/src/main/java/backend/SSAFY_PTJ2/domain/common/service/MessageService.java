package backend.SSAFY_PTJ2.domain.common.service;

import backend.SSAFY_PTJ2.domain.common.dto.MessageDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 메시지 도메인 서비스
 * 비즈니스 규칙 및 메시지 검증/정제 로직을 담당
 */
@Slf4j
@Service
public class MessageService {

    /**
     * 일반 메시지 검증 및 정제
     * @param messageDto 검증할 메시지
     * @return 검증된 메시지
     */
    public MessageDto validateAndCleanMessage(MessageDto messageDto) {
        log.info("일반 메시지 검증 시작: {}", messageDto.getMessageId());

        // 메시지 ID가 없으면 생성
        if (!StringUtils.hasText(messageDto.getMessageId())) {
            messageDto.setMessageId(UUID.randomUUID().toString());
        }

        // 타임스탬프 설정
        if (messageDto.getTimestamp() == null) {
            messageDto.setTimestamp(LocalDateTime.now());
        }

        // 메시지 타입 기본값 설정
        if (messageDto.getType() == null) {
            messageDto.setType(MessageDto.MessageType.GENERAL);
        }

        // 상태 기본값 설정
        if (messageDto.getStatus() == null) {
            messageDto.setStatus(MessageDto.ProcessStatus.PENDING);
        }

        // 메시지 내용 검증
        validateMessageContent(messageDto);

        log.info("일반 메시지 검증 완료: {}", messageDto.getMessageId());
        return messageDto;
    }

    /**
     * 텍스트 메시지 검증
     * @param messageDto 검증할 텍스트 메시지
     * @return 검증된 텍스트 메시지
     */
    public MessageDto validateTextMessage(MessageDto messageDto) {
        log.info("텍스트 메시지 검증 시작: {}", messageDto.getMessageId());

        // 공통 검증 수행
        messageDto = validateAndCleanMessage(messageDto);

        // 텍스트 메시지 특화 검증
        if (!StringUtils.hasText(messageDto.getContent())) {
            throw new IllegalArgumentException("텍스트 메시지의 내용이 비어있습니다.");
        }

        // 텍스트 길이 검증 (예: 최대 10000자)
        if (messageDto.getContent().length() > 10000) {
            throw new IllegalArgumentException("텍스트 메시지가 너무 깁니다. (최대 10000자)");
        }

        // 메시지 타입을 TEXT로 설정
        messageDto.setType(MessageDto.MessageType.TEXT);

        log.info("텍스트 메시지 검증 완료: {}", messageDto.getMessageId());
        return messageDto;
    }

    /**
     * 이미지 메시지 검증
     * @param messageDto 검증할 이미지 메시지
     * @return 검증된 이미지 메시지
     */
    public MessageDto validateImageMessage(MessageDto messageDto) {
        log.info("이미지 메시지 검증 시작: {}", messageDto.getMessageId());

        // 공통 검증 수행
        messageDto = validateAndCleanMessage(messageDto);

        // 이미지 데이터 검증
        if (!StringUtils.hasText(messageDto.getData())) {
            throw new IllegalArgumentException("이미지 데이터가 비어있습니다.");
        }

        // Base64 형식 검증 (간단한 체크)
        if (!isValidBase64Image(messageDto.getData())) {
            throw new IllegalArgumentException("올바르지 않은 이미지 데이터 형식입니다.");
        }

        // 메시지 타입을 IMAGE로 설정
        messageDto.setType(MessageDto.MessageType.IMAGE);

        log.info("이미지 메시지 검증 완료: {}", messageDto.getMessageId());
        return messageDto;
    }

    /**
     * 처리된 메시지 후처리
     * @param messageDto 처리된 메시지
     * @return 후처리된 메시지
     */
    public MessageDto postProcessMessage(MessageDto messageDto) {
        log.info("메시지 후처리 시작: {}", messageDto.getMessageId());

        // 처리 상태를 완료로 변경
        messageDto.setStatus(MessageDto.ProcessStatus.COMPLETED);

        // 처리 완료 시간 업데이트
        messageDto.setTimestamp(LocalDateTime.now());

        // 에러 메시지 클리어
        messageDto.setErrorMessage(null);

        log.info("메시지 후처리 완료: {}", messageDto.getMessageId());
        return messageDto;
    }

    /**
     * 필터링 결과 후처리
     * @param messageDto 필터링된 메시지
     * @return 후처리된 필터링 결과
     */
    public MessageDto postProcessFilterResult(MessageDto messageDto) {
        log.info("필터링 결과 후처리 시작: {}", messageDto.getMessageId());

        // 응답 타입으로 변경
        messageDto.setType(MessageDto.MessageType.FILTER_RESPONSE);

        // 처리 상태를 완료로 변경
        messageDto.setStatus(MessageDto.ProcessStatus.COMPLETED);

        // 처리 완료 시간 업데이트
        messageDto.setTimestamp(LocalDateTime.now());

        log.info("필터링 결과 후처리 완료: {}", messageDto.getMessageId());
        return messageDto;
    }

    /**
     * 메시지 내용 검증 (공통)
     * @param messageDto 검증할 메시지
     */
    private void validateMessageContent(MessageDto messageDto) {
        // 내용이 완전히 비어있으면 안됨
        if (!StringUtils.hasText(messageDto.getContent()) && !StringUtils.hasText(messageDto.getData())) {
            throw new IllegalArgumentException("메시지 내용이나 데이터 중 하나는 필수입니다.");
        }

        // 송신자 ID 검증
        if (!StringUtils.hasText(messageDto.getSenderId())) {
            messageDto.setSenderId("unknown");
        }
    }

    /**
     * Base64 이미지 데이터 형식 검증 (간단한 체크)
     * @param data 검증할 데이터
     * @return 유효한 형식인지 여부
     */
    private boolean isValidBase64Image(String data) {
        try {
            // Base64 형식인지 간단히 체크
            return data.matches("^data:image\\/[a-zA-Z]+;base64,[A-Za-z0-9+\\/]+=*$") ||
                   data.matches("^[A-Za-z0-9+\\/]+=*$");
        } catch (Exception e) {
            return false;
        }
    }
}