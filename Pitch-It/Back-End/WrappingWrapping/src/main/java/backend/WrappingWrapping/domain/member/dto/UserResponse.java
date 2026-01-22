package backend.WrappingWrapping.domain.member.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public abstract class UserResponse {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailInfoDTO {
        Long id;
        String email;
        String name;
        String nickname;
    }

    @Builder
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateResponse {
        String nickname;
    }
}
