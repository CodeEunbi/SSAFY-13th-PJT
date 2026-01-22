package backend.WrappingWrapping.domain.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public abstract class ReportResponse {

    @Builder
    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DetailListDTO {
        private Long id;
        private LocalDateTime meetingAt;
        private String job;
        private String mode;
        private String title;
        private LocalDateTime createdAt;
    }

    @Builder
    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DetailInfoDTO {
        private Long id;
        private LocalDateTime meetingAt;
        private String job;
        private String mode;
        private String title;
        private String situation;
        private String requirements;
        private String question;
        private String content;
        private LocalDateTime createdAt;
    }

    @Builder
    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DetailListResponse {
        private List<DetailListDTO> reports;
        private int totalPages;
        private long totalElements;
    }
}