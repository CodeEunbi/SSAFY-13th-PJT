package backend.SSAFY_PTJ2.infrastructure.ai;

import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageAIRequest;

public interface ImageAIClient {
    AnalysisResult analyze(ImageAIRequest request);
    boolean health();
}
