package backend.SSAFY_PTJ2.domain.textfilter.converter;

import backend.SSAFY_PTJ2.domain.textfilter.TextLabels;
import backend.SSAFY_PTJ2.domain.textfilter.dto.TextAIResponse;

import java.util.List;
import java.util.Map;

public interface TextAnalysisConverter {

    /** 요소별 스팬 결과(필터링 구간과 표준 라벨/신뢰도) */
    record ElementSpanResult(String elementId, List<Span> spans) {
        public record Span(int start, int end,
                           List<TextLabels> labels,
                           Map<TextLabels, Double> confidence) {}
    }

    /** 외부 AI 응답 → 표준 라벨로 매핑 */
    List<ElementSpanResult> convert(TextAIResponse response);
}
