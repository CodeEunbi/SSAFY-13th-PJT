package backend.WrappingWrapping.global.subject.service;

import backend.WrappingWrapping.domain.prompt.Prompt;
import backend.WrappingWrapping.domain.prompt.PromptService;
import backend.WrappingWrapping.domain.reservation.JobCategory;
import backend.WrappingWrapping.domain.reservation.ModeType;
import backend.WrappingWrapping.global.openai.OpenAiClient;
import backend.WrappingWrapping.global.openai.dto.OpenAiResponse;
import backend.WrappingWrapping.global.subject.dto.SubjectConverter;
import backend.WrappingWrapping.global.subject.dto.SubjectResponse;
import backend.WrappingWrapping.response.exception.GeneralException;
import backend.WrappingWrapping.response.status.ErrorStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class SubjectService {
    public final SubjectConverter subjectConverter;
    public final OpenAiClient openAiClient;
    public final PromptService promptService;
    private final ObjectMapper objectMapper;

    public SubjectResponse.GenerateResult getSubject(JobCategory job, ModeType mode) {
        String prompt = promptService.findByModeAndJob(mode, job).getPromptText();
        String raw = openAiClient.sendChatRequest(prompt);

        OpenAiResponse response;
        try {
            response = objectMapper.readValue(raw, OpenAiResponse.class);
        } catch (Exception e) {
            throw new GeneralException(ErrorStatus.OPENAI_RESPONSE_PARSING_FAILED, e);
        }

        if (response.getChoices() == null || response.getChoices().isEmpty()) {
            throw new GeneralException(ErrorStatus.OPENAI_EMPTY_RESPONSE);
        }

        String subject = response.getChoices().getFirst().getMessage().getContent();

        ParsedSubject parsed = parseSubjectText(subject);

        return subjectConverter.toResponse(parsed.situation(), parsed.constraints(), parsed.subject());

    }

    private ParsedSubject parseSubjectText(String subjectText) {
        String situation, constraints, subject;

        String[] parts = subjectText.split("\\[.*?]");

        if (parts.length >= 4) {
            situation = parts[1].trim();
            constraints = parts[2].trim();
            subject = parts[3].trim();
        } else {
            throw new GeneralException(ErrorStatus.BAD_REQUEST, "응답 포맷이 예상과 다릅니다.");
        }

        return new ParsedSubject(situation, constraints, subject);
    }

    private record ParsedSubject(String situation, String constraints, String subject) {
    }

}
