package backend.WrappingWrapping.global.oauth.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@NoArgsConstructor
@ToString
public class GoogleUserInfo {
    private String email;
    private String name;
}
