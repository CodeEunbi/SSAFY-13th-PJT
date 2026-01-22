package backend.WrappingWrapping.domain.reservation.dto;

import java.time.LocalDateTime;
import lombok.Getter;

public class ReservationRequest {
    @Getter
    public static class CreateDTO {
        String title;
        LocalDateTime scheduledTime;
        int maxParticipant;
        String job;
        String mode;
    }
}
