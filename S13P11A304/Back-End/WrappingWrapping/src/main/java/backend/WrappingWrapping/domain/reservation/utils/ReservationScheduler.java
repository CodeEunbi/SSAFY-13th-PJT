package backend.WrappingWrapping.domain.reservation.utils;

import backend.WrappingWrapping.domain.member.dto.UserResponse.DetailInfoDTO;
import backend.WrappingWrapping.domain.member.service.UserService;
import backend.WrappingWrapping.domain.reservation.Reservation;
import backend.WrappingWrapping.domain.reservation.service.ReservationService;
import backend.WrappingWrapping.global.mail.MailService;
import backend.WrappingWrapping.global.subject.dto.SubjectResponse.GenerateResult;
import backend.WrappingWrapping.global.subject.service.SubjectService;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationScheduler {
    private final ReservationService reservationService;
    private final UserService userService;
    private final MailService mailService;
    private final SubjectService subjectService;

    private final String URL = "https://pitch-it.co.kr/waiting/";

    @Scheduled(cron = "0 * * * * *") // 매분 확인
    public void activateReservations() {
        List<Reservation> reservationsToActivate = reservationService.getReservationsToActivateSoon();
        for (Reservation reservation : reservationsToActivate) {
            List<Long> shuffled = new ArrayList<>(reservation.getParticipantIds());
            Collections.shuffle(shuffled);

            reservation.setOrder(shuffled);

            reservation.setActive(true);

            String meetingUrl = URL + reservation.getId();

            for (Long participantId : reservation.getParticipantIds()) {
                DetailInfoDTO participant = userService.getUser(participantId);
                mailService.sendMeetingInvitation(
                        participant.getEmail(),
                        meetingUrl,
                        reservation.getTitle(),
                        reservation.getScheduledTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                );
                log.info("Sent email to: {}", participant.getEmail());
            }
            GenerateResult subject = subjectService.getSubject(reservation.getJob(), reservation.getMode());
            reservation.setRequirements(subject.getRequirements());
            reservation.setSituation(subject.getSituation());
            reservation.setQuestion(subject.getQuestion());

            // DB 업데이트
            reservationService.updateReservation(reservation);
        }
    }
}
