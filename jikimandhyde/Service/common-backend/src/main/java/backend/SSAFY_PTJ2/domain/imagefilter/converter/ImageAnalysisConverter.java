package backend.SSAFY_PTJ2.domain.imagefilter.converter;

import backend.SSAFY_PTJ2.domain.imagefilter.ImageLabels;
import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageAIResponse;

import java.util.List;

public interface ImageAnalysisConverter {

    /** 표준화된 이미지 분석 결과 */
    record ImageResult(String id, String filename, ImageLabels label, double prob){}

    /** 외부 AI 응답 -> 표준 라벨로 매핑 */
    List<ImageResult> convert(ImageAIResponse response);
}
