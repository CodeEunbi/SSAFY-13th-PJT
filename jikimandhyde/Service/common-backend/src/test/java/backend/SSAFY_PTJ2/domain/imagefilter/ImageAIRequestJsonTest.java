package backend.SSAFY_PTJ2.domain.imagefilter;

import backend.SSAFY_PTJ2.domain.imagefilter.dto.ImageAIRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ImageAIRequestJsonTest {

    /**
     * ImageAIRequest를 JSON으로 직렬화할 때, 바이너리(imageData)가 JSON에 포함되지 않는지 확인
     * @throws Exception
     */
    @Test
    void serialize_ignoresBinary_ok() throws Exception {
        ImageAIRequest req = ImageAIRequest.builder()
                .imageFiles(List.of(
                        ImageAIRequest.ImageFile.builder()
                                .id("img-1")
                                .filename("a.webp")
                                .imageData(new byte[]{1,2,3}) // @JsonIgnore 여기에 적용되어야 함
                                .mimeType("image/webp")
                                .size(3L)
                                .build()
                ))
                .build();

        ObjectMapper om = new ObjectMapper();
        String json = om.writeValueAsString(req);

        assertTrue(json.contains("\"imageFiles\""));
        assertTrue(json.contains("\"filename\":\"a.webp\""));
        assertTrue(json.contains("\"mimeType\":\"image/webp\""));
        // 바이너리 필드는 제외되어야 함
        assertFalse(json.contains("imageData"));
    }
}