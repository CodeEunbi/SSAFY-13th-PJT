package backend.SSAFY_PTJ2.domain.textfilter;

import backend.SSAFY_PTJ2.domain.textfilter.dto.TextAIResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class TextAIResponseJsonTest {

    /**
     * 실제 응답처럼 생긴 JSON 문자열을 TextAIResponse로 역직렬화함
     */
    @Test
    void deserialize_ok() throws Exception {
        String json = """
        {
          "isSuccess": true,
          "code": "OK",
          "message": "",
          "result": {
            "blurredTextsInfo": [
              {
                "elementId": "el-1",
                "filteredIndexes": [
                  {
                    "sIdx": 0,
                    "eIdx": 11,
                    "detectedLabels": ["IN","SE"],
                    "confidence": {"IN":0.92,"SE":0.31,"CLEAN":0.02}
                  }
                ]
              }
            ]
          }
        }
        """;

        ObjectMapper om = new ObjectMapper();
        TextAIResponse resp = om.readValue(json, TextAIResponse.class);

        assertTrue(resp.isSuccess());
        assertEquals("OK", resp.getCode());
        assertNotNull(resp.getResult());
        var info = resp.getResult().getBlurredTextsInfo();
        assertEquals(1, info.size());
        assertEquals("el-1", info.get(0).getElementId());

        var f0 = info.get(0).getFilteredIndexes().get(0);
        assertEquals(0, f0.getSIdx());
        assertEquals(11, f0.getEIdx());
        assertEquals(List.of("IN", "SE"), f0.getDetectedLabels());
        assertEquals(0.92, f0.getConfidence().get("IN"), 1e-9);
    }
}
