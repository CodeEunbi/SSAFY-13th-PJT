package backend.WrappingWrapping.domain.prompt.repository;

import backend.WrappingWrapping.domain.prompt.Prompt;
import backend.WrappingWrapping.domain.reservation.JobCategory;
import backend.WrappingWrapping.domain.reservation.ModeType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromptRepository extends JpaRepository<Prompt, Long> {
    Prompt findByModeTypeAndJobCategory(ModeType modeType, JobCategory jobCategory);
}
