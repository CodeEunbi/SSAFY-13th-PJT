package backend.WrappingWrapping.global.subject.dto;

import org.springframework.stereotype.Component;

@Component
public class SubjectConverter {

    public SubjectResponse.GenerateResult toResponse(String situation, String constraints, String subject) {
        return SubjectResponse.GenerateResult.builder()
                .situation(situation)
                .requirements(constraints)
                .question(subject)
                .build();
    }
}
