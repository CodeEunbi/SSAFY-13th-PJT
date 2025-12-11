package backend.WrappingWrapping.domain.member;


import static jakarta.persistence.EnumType.STRING;
import static jakarta.persistence.GenerationType.IDENTITY;
import static lombok.AccessLevel.PROTECTED;

import backend.WrappingWrapping.domain.common.BaseRDBEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@NoArgsConstructor(access = PROTECTED)
@Getter
@ToString
public class User extends BaseRDBEntity {
    @Id
    @GeneratedValue(strategy = IDENTITY)
    @Column(name = "id")
    private Long id;

    @Email
    @Column(name = "email")
    private String email;

    @Column(name = "name")
    private String name;

    @Column(name = "nickname")
    private String nickname;

    @Column(name = "role")
    @Enumerated(STRING)
    private RoleType role;

    @Builder
    private User(String email, String name, String nickname, RoleType role) {
        this.email = email;
        this.name = name;
        this.nickname = nickname;
        this.role = role;
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }
}
