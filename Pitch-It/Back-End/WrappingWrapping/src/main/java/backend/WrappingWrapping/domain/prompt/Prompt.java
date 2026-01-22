package backend.WrappingWrapping.domain.prompt;

import static jakarta.persistence.EnumType.STRING;

import backend.WrappingWrapping.domain.reservation.JobCategory;
import backend.WrappingWrapping.domain.reservation.ModeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;

@Entity
public class Prompt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @Column(nullable = false)
    @Enumerated(STRING)
    private ModeType modeType;

    @Getter
    @Column(nullable = false)
    @Enumerated(STRING)
    private JobCategory jobCategory;

    @Getter
    @Column(nullable = false, length = 2000)
    private String promptText;
}
