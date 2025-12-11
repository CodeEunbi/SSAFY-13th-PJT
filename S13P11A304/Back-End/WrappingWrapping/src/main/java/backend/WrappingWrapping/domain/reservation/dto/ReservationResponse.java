package backend.WrappingWrapping.domain.reservation.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class ReservationResponse {
    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DetailInfo {
        Long id;
        String title;
        LocalDateTime scheduledTime;
        boolean isActive;
        int participants;
        int maxParticipant;
        String jobCategory;
        String modeType;
        boolean is_participant;
    }

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class OrderList {
        private List<Long> order;
    }

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class DetailInfoList {
        private List<DetailInfo> detailInfoList;
        private int totalPage;
        private long totalElements;
    }

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class SimpleParticipantsList {
        private List<Long> participantIds;
    }

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class SimpleScheduledTime {
        private LocalDateTime scheduledTime;
    }

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class SimpleInfo {
        Long id;
        String title;
        LocalDateTime scheduledTime;
        String jobCategory;
        String modeType;
    }

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class SimpleInfoList {
        private List<SimpleInfo> simpleInfoList;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Basic {
        private LocalDateTime scheduledTime;
        private List<Long> participantIds;
        private String title;
        private String jobCategory;
        private String modeType;
        private String situation;
        private String requirements;
        private String question;
    }
}
