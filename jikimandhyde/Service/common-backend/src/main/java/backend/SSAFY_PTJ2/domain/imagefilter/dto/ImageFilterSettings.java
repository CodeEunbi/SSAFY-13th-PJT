package backend.SSAFY_PTJ2.domain.imagefilter.dto;

import backend.SSAFY_PTJ2.domain.imagefilter.ImageLabels;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Set;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ImageFilterSettings {
    private String sessionId;
    private Set<ImageLabels> enabledFilters;
    private boolean originalViewEnabled;

    public boolean shouldFilter(ImageLabels label) {
        return enabledFilters != null && enabledFilters.contains(label);
    }
}