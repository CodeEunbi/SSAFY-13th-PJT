package backend.WrappingWrapping.domain.reservation;

import static jakarta.persistence.EnumType.STRING;
import static lombok.AccessLevel.PROTECTED;

import backend.WrappingWrapping.domain.common.BaseRDBEntity;
import backend.WrappingWrapping.domain.member.User;
import backend.WrappingWrapping.domain.reservation.utils.LongListConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@NoArgsConstructor(access = PROTECTED)
public class Reservation extends BaseRDBEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private LocalDateTime scheduledTime;

    @Setter
    private boolean isActive;

    @ManyToOne(fetch = FetchType.LAZY)
    private User creator;

    @Convert(converter = LongListConverter.class)
    @Column(columnDefinition = "TEXT")
    @Setter
    private List<Long> participantIds = new ArrayList<>();

    @Getter
    @Column(nullable = false)
    @Enumerated(STRING)
    private JobCategory job;

    @Getter
    @Column(nullable = false)
    @Enumerated(STRING)
    private ModeType mode;

    @Getter
    @Column(nullable = false)
    private int max_participant;

    @Convert(converter = LongListConverter.class)
    @Column(name = "`order`", columnDefinition = "TEXT")
    @Setter
    private List<Long> order = new ArrayList<>();

    @Setter
    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Setter
    @Column(columnDefinition = "TEXT")
    private String situation;

    @Setter
    @Column(columnDefinition = "TEXT")
    private String question;


    @Builder
    public Reservation(String title, LocalDateTime scheduledTime, User creator, JobCategory job, ModeType mode,
                       int max_participant) {
        this.title = title;
        this.scheduledTime = scheduledTime;
        this.creator = creator;
        this.job = job;
        this.max_participant = max_participant;
        this.mode = mode;
    }
}
