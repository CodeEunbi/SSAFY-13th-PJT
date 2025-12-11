package backend.SSAFY_PTJ2.domain.imagefilter;

import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageAIResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ImageAIResponseJsonTest {

    /**
     * 이미지 배치 응답 JSON을 ImageAIResponse로 역직렬화
     */
    @Test
    void deserialize_ok() throws Exception {
        String json = """
        {
          "results": [
            {"id":"img-1","filename":"a.jpg","label":"normal","prob":0.98},
            {"id":"img-2","filename":"b.png","label":"crime","prob":0.87}
          ],
          "imageCount": {"processedImages":2,"skippedImages":0}
        }
        """;

        ObjectMapper om = new ObjectMapper();
        ImageAIResponse resp = om.readValue(json, ImageAIResponse.class);

        assertEquals(2, resp.getResults().size());
        assertEquals("a.jpg", resp.getResults().get(0).getFilename());
        assertEquals("normal", resp.getResults().get(0).getLabel());
        assertEquals(2, resp.getImageCount().getProcessedImages());
    }
}