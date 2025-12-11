package backend.WrappingWrapping.domain.member.service;

import backend.WrappingWrapping.domain.member.User;
import backend.WrappingWrapping.domain.member.dto.UserConverter;
import backend.WrappingWrapping.domain.member.dto.UserRequest;
import backend.WrappingWrapping.domain.member.dto.UserResponse;
import backend.WrappingWrapping.domain.member.repository.UserRepository;
import backend.WrappingWrapping.response.exception.GeneralException;
import backend.WrappingWrapping.response.status.ErrorStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;
    private final UserConverter userConverter;

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    public UserResponse.DetailInfoDTO getUser(Long id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new GeneralException(ErrorStatus.MEMBER_NOT_EXIST));
        return userConverter.toDetailInfo(user);
    }

    @Transactional
    public UserResponse.UpdateResponse updateUser(Long id, UserRequest.updateDTO request) {
        User user = repository.findById(id)
                .orElseThrow(() -> new GeneralException(ErrorStatus.MEMBER_NOT_EXIST));

        String newNickname = request.getNickname().trim();

        // 기존 닉네임과 동일한 경우 - 변경 불필요
        if (user.getNickname().equals(newNickname)) {
            return userConverter.toUpdateResponse(user);  // 그대로 리턴
        }

        // 닉네임 중복 체크
        if (repository.existsByNickname(newNickname)) {
            throw new GeneralException(ErrorStatus.MEMBER_DUPLICATE_BY_NICKNAME);
        }

        // 닉네임 업데이트
        user.updateNickname(newNickname);

        return userConverter.toUpdateResponse(user);
    }
}
