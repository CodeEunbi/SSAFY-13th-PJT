package backend.SSAFY_PTJ2.domain.textfilter.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.extern.jackson.Jacksonized;

import java.util.List;
import java.util.Map;

/**
 * 텍스트 AI 컨테이너 요청 DTO - 개발자 B 담당
 *
 * 외부 텍스트 AI 컨테이너(/filter_page)와의 HTTP 통신에 사용되는 요청 DTO입니다.
 * JSON 형태로 다중 텍스트 요소를 배치 전송합니다.
 */
@Getter
@Builder
@Jacksonized
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@ToString
public class TextAIRequest {

    private String pageUrl;  // 분석 대상 페이지 URL
    private List<TextElement> textElements;  // 텍스트 요소 목록

    /**
     * 사용자 텍스트 필터 설정
     * key: 혐오 카테고리 코드 (IN, VI, PO, AD, SE)
     * value: 해당 카테고리 필터링 사용 여부
     */
    private Map<String, Boolean> textFilterCategory;  // 사용자 텍스트 필터 설정
    private Double threshold;  // 분류 임계값


    /**
     * 텍스트 요소 정보
     */
    @Getter
    @Builder
    @Jacksonized
    @AllArgsConstructor
    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    @ToString
    public static class TextElement {

        private String elementId;  // 요소 식별자 -> DOM elementId
        private List<TextData> texts;  // 해당 요소의 텍스트 목록
    }

    /**
     * 개별 텍스트 데이터
     */
    @Getter
    @Builder
    @Jacksonized
    @AllArgsConstructor
    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    @ToString
    public static class TextData {

        private String text;  // 텍스트 내용

        @JsonProperty("sIdx")
        @JsonAlias({"sidx","s_index","start"})
        private int sIdx;  // 텍스트 시작 인덱스 (전체 요소 내에서)

        @JsonProperty("eIdx")
        @JsonAlias({"eidx","e_index","end"})
        private int eIdx;  // 텍스트 종료 인덱스 (전체 요소 내에서)
    }
}