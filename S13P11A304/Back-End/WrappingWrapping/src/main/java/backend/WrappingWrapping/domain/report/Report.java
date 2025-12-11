package backend.WrappingWrapping.domain.report;

import backend.WrappingWrapping.domain.common.BaseRDBEntity;
import backend.WrappingWrapping.domain.member.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import static jakarta.persistence.GenerationType.IDENTITY;
import static lombok.AccessLevel.PROTECTED;

@Entity
@NoArgsConstructor(access = PROTECTED)
@Getter
@ToString
public class Report extends BaseRDBEntity {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "meeting_at", nullable = false)
    private LocalDateTime meetingAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "job", nullable = false)
    private JobType job;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false)
    private ModeType mode;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "situation", columnDefinition = "TEXT")
    private String situation;

    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "question", length = 255)
    private String question;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Builder
    private Report(User user,
                   LocalDateTime meetingAt,
                   JobType job,
                   ModeType mode,
                   String title,
                   String situation,
                   String requirements,
                   String question,
                   String content) {
        this.user = user;
        this.meetingAt = meetingAt;
        this.job = job;
        this.mode = mode;
        this.title = title;
        this.situation = situation;
        this.requirements = requirements;
        this.question = question;
        this.content = content;
    }

    public enum JobType {
        MANAGEMENT,
        MARKETING,
        TRADE,
        DEVELOPER,
        MANUFACTURING,
        CONSTRUCTION,
        SALES,
        FINANCE,
        MEDIA,
        DESIGN
    }

    public enum ModeType {
        PT,
        인성,
        기술
    }
}
