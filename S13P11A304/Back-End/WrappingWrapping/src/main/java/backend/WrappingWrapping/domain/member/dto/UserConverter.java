package backend.WrappingWrapping.domain.member.dto;

import backend.WrappingWrapping.domain.member.User;
import backend.WrappingWrapping.domain.member.dto.UserResponse.UpdateResponse;
import org.springframework.stereotype.Component;

@Component
public class UserConverter {
    public UserResponse.DetailInfoDTO toDetailInfo(User user) {
        return new UserResponse.DetailInfoDTO(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname()
        );
    }

    public UpdateResponse toUpdateResponse(User user) {
        return new UserResponse.UpdateResponse(
                user.getNickname()
        );
    }
}
