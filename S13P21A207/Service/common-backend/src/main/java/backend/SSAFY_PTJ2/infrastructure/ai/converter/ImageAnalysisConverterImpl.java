package backend.SSAFY_PTJ2.infrastructure.ai.converter;

import backend.SSAFY_PTJ2.domain.imagefilter.ImageLabels;
import backend.SSAFY_PTJ2.domain.imagefilter.converter.ImageAnalysisConverter;
import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageAIResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ImageAnalysisConverterImpl implements ImageAnalysisConverter {

    @Override
    public List<ImageResult> convert(ImageAIResponse response) {
        if (response == null || response.getResults() == null) return List.of();
        return response.getResults().stream()
                .map(r -> new ImageResult(
                        r.getId(),
                        r.getFilename(),
                        map(r.getLabel()),
                        r.getProb()
                ))
                .toList();
    }

    private ImageLabels map(String raw) {
        if (raw == null) return ImageLabels.CLEAN;  // 기본은 CLEAN 처리
        return switch (raw.trim().toUpperCase()) {
            case "CR", "CRIME" -> ImageLabels.CRIME;
            case "AC", "ACCIDENT", "DI", "DISASTER" -> ImageLabels.ACCIDENT;
            case "HO", "HORROR" -> ImageLabels.HORROR;
            case "GO", "GORE" -> ImageLabels.GORE;
            case "SE", "SEXUAL" -> ImageLabels.SEXUAL;
            case "CLEAN", "NORMAL" -> ImageLabels.CLEAN;
            default -> ImageLabels.CLEAN;
        };
    }
}
