package backend.WrappingWrapping.domain.prompt;

import backend.WrappingWrapping.domain.prompt.repository.PromptRepository;
import backend.WrappingWrapping.domain.reservation.JobCategory;
import backend.WrappingWrapping.domain.reservation.ModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PromptService {
    private final PromptRepository promptRepository;

    public Prompt findByModeAndJob(ModeType modeType, JobCategory jobCategory) {
        return promptRepository.findByModeTypeAndJobCategory(modeType, jobCategory);
    }
}
