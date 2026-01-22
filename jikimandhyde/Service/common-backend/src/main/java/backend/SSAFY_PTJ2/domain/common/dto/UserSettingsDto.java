// src/main/java/backend/SSAFY_PTJ2/domain/common/dto/UserSettingsDto.java
package backend.SSAFY_PTJ2.domain.common.dto;

import backend.SSAFY_PTJ2.domain.imagefilter.ImageLabels;
import backend.SSAFY_PTJ2.domain.textfilter.TextLabels;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class UserSettingsDto {
    private String type;
    private Settings settings;

    @JsonProperty("__meta")
    private Meta meta;

    @Data
    @NoArgsConstructor
    public static class Settings {
        private boolean serviceEnabled;
        private boolean showIcon;
        private boolean filteringEnabled;
        private FilterImage filterImage;
        private FilterText filterText;
    }

    @Data
    @NoArgsConstructor
    public static class FilterImage {
        private boolean enabled;
        private boolean originalViewEnabled;
        private List<ImageLabels> categories;
    }

    @Data
    @NoArgsConstructor
    public static class FilterText {
        private boolean enabled;
        private boolean originalViewEnabled;
        private List<TextLabels> categories;
    }

    @Data
    @NoArgsConstructor
    public static class Meta {
        private String updatedAt;
    }
}