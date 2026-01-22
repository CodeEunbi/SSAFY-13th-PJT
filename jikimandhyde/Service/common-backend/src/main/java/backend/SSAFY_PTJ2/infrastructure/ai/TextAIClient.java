package backend.SSAFY_PTJ2.infrastructure.ai;

import backend.SSAFY_PTJ2.domain.common.dto.AnalysisResult;
import backend.SSAFY_PTJ2.domain.textfilter.dto.TextAIRequest;

public interface TextAIClient {
    AnalysisResult analyze(TextAIRequest request);
    boolean health();
}
