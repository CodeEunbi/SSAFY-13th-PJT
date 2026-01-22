package backend.SSAFY_PTJ2.infrastructure.ai.converter;

import backend.SSAFY_PTJ2.domain.textfilter.TextLabels;
import backend.SSAFY_PTJ2.domain.textfilter.converter.TextAnalysisConverter;
import backend.SSAFY_PTJ2.domain.textfilter.dto.TextAIResponse;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class TextAnalysisConverterImpl implements TextAnalysisConverter {

    @Override
    public List<ElementSpanResult> convert(TextAIResponse response) {
        if (response == null || !response.isSuccess()) return List.of();
        var filteredElements = response.getFilteredElements();
        if (filteredElements == null) return List.of();

        List<ElementSpanResult> out = new ArrayList<>();
        for (var element : filteredElements) {
            List<ElementSpanResult.Span> spans = new ArrayList<>();
            if (element.getFilteredTexts() != null) {
                for (var filteredText : element.getFilteredTexts()) {
                    // detectedLabels → 표준 라벨 목록
                    List<TextLabels> labels = Optional.ofNullable(filteredText.getDetectedLabels())
                            .orElseGet(List::of)
                            .stream().map(this::map).toList();

                    // confidence(Map<String,Double>) → Map<TextLabels,Double>
                    Map<TextLabels, Double> conf = new HashMap<>();
                    if (filteredText.getConfidence() != null) {
                        for (var e : filteredText.getConfidence().entrySet()) {
                            conf.put(map(e.getKey()), e.getValue());
                        }
                    }

                    spans.add(new ElementSpanResult.Span(
                            filteredText.getSIdx(), filteredText.getEIdx(), labels, conf));
                }
            }
            out.add(new ElementSpanResult(element.getElementId(), spans));
        }
        return out;
    }

    private TextLabels map(String raw) {
        if (raw == null) return TextLabels.CLEAN;
        return switch (raw.trim().toUpperCase()) {
            case "IN", "INSULT" -> TextLabels.INSULT;
            case "VI", "VIOLENCE" -> TextLabels.VIOLENCE;
            case "SE", "SEXUAL" -> TextLabels.SEXUAL;
            case "AD", "ADVERTISEMENT" -> TextLabels.AD;
            case "PO", "POLITICS" -> TextLabels.POLITICS;
            case "CLEAN", "NORMAL" -> TextLabels.CLEAN;
            default -> TextLabels.CLEAN;
        };
    }

}
