package backend.SSAFY_PTJ2.domain.textfilter;

import backend.SSAFY_PTJ2.domain.textfilter.dto.TextAIRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class TextAIRequestJsonTest {

    /**
     * TextAIRequest를 자바 객체 -> JSON으로 직렬화하고, 다시 JSON -> 객체로 역직렬화(라운드트립)함
     */
    @Test
    void serialize_and_deserialize_ok() throws Exception {
        TextAIRequest src = TextAIRequest.builder()
                .pageUrl("https://example.com/page1")
                .textElements(List.of(
                        TextAIRequest.TextElement.builder()
                                .elementId("el-1")
                                .texts(List.of(
                                        TextAIRequest.TextData.builder().text("hello").sIdx(0).eIdx(5).build(),
                                        TextAIRequest.TextData.builder().text("world").sIdx(6).eIdx(11).build()
                                ))
                                .build(),
                        TextAIRequest.TextElement.builder()
                                .elementId("el-2")
                                .texts(List.of(
                                        TextAIRequest.TextData.builder().text("insult here").sIdx(0).eIdx(11).build()
                                ))
                                .build()
                ))
                .textFilterCategory(Map.of("IN", true, "VI", false))
                .threshold(0.5)
                .build();

        ObjectMapper om = new ObjectMapper();
        String json = om.writeValueAsString(src);

        assertTrue(json.contains("\"pageUrl\""));
        assertTrue(json.contains("\"textElements\""));
        assertTrue(json.contains("\"threshold\":0.5"));

        TextAIRequest back = om.readValue(json, TextAIRequest.class);
        assertEquals("https://example.com/page1", back.getPageUrl());
        assertEquals(2, back.getTextElements().size());
        assertEquals("el-1", back.getTextElements().get(0).getElementId());
        assertEquals(0.5, back.getThreshold());
        assertTrue(back.getTextFilterCategory().get("IN"));
    }
}