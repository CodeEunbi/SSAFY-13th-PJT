package backend.WrappingWrapping.domain.reservation.dto;

import backend.WrappingWrapping.domain.reservation.Reservation;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class ReservationConverter {
    public static ReservationResponse.DetailInfoList toDetailInfoList(List<Reservation> reservations, Long userId,
                                                                      int totalPage, long totalElements) {
        List<ReservationResponse.DetailInfo> detailInfos = reservations.stream()
                .map(reservation -> ReservationResponse.DetailInfo.builder()
                        .id(reservation.getId())
                        .title(reservation.getTitle())
                        .scheduledTime(reservation.getScheduledTime())
                        .participants(reservation.getParticipantIds().size())
                        .maxParticipant(reservation.getMax_participant())
                        .jobCategory(reservation.getJob().toString())
                        .modeType(reservation.getMode().toString())
                        .isActive(reservation.isActive())
                        .is_participant(reservation.getParticipantIds().contains(userId))
                        .build())
                .collect(Collectors.toList());
        return ReservationResponse.DetailInfoList.builder()
                .detailInfoList(detailInfos)
                .totalPage(totalPage)
                .totalElements(totalElements)
                .build();
    }

    public static ReservationResponse.SimpleInfoList toSimpleInfoList(List<Reservation> reservations) {
        List<ReservationResponse.SimpleInfo> simpleInfos = reservations.stream()
                .map(reservation -> ReservationResponse.SimpleInfo.builder()
                        .id(reservation.getId())
                        .title(reservation.getTitle())
                        .scheduledTime(reservation.getScheduledTime())
                        .jobCategory(reservation.getJob().toString())
                        .modeType(reservation.getMode().toString())
                        .build())
                .collect(Collectors.toList());
        return ReservationResponse.SimpleInfoList.builder()
                .simpleInfoList(simpleInfos)
                .build();
    }

    public static ReservationResponse.SimpleParticipantsList toSimpleParticipantsList(List<Long> ids) {
        return ReservationResponse.SimpleParticipantsList.builder()
                .participantIds(ids)
                .build();
    }

    public static ReservationResponse.SimpleScheduledTime toSimpleScheduledTime(LocalDateTime scheduledTime) {
        return ReservationResponse.SimpleScheduledTime.builder()
                .scheduledTime(scheduledTime)
                .build();
    }

    public static ReservationResponse.OrderList toOrderList(List<Long> ids) {
        return ReservationResponse.OrderList.builder()
                .order(ids)
                .build();
    }

    public static ReservationResponse.Basic toBasic(Reservation r) {
        return ReservationResponse.Basic.builder()
                .scheduledTime(r.getScheduledTime())
                .jobCategory(r.getJob().toString())
                .modeType(r.getMode().toString())
                .participantIds(r.getParticipantIds())
                .title(r.getTitle())
                .question(r.getQuestion())
                .requirements(r.getRequirements())
                .situation(r.getSituation())
                .build();
    }

}
