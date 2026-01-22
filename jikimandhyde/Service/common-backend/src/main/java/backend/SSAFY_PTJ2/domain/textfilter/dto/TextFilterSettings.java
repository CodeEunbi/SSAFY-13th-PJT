package backend.SSAFY_PTJ2.domain.textfilter.dto;

import backend.SSAFY_PTJ2.domain.textfilter.TextLabels;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TextFilterSettings implements Serializable {
    private String sessionId;
    private Set<TextLabels> enabledFilters;
    private boolean originalViewEnabled;

    public boolean shouldFilter(TextLabels label) {
        return enabledFilters != null && enabledFilters.contains(label);
    }
}