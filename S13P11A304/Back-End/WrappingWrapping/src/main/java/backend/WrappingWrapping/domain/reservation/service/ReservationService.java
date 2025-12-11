package backend.WrappingWrapping.domain.reservation.service;

import backend.WrappingWrapping.domain.member.User;
import backend.WrappingWrapping.domain.member.repository.UserRepository;
import backend.WrappingWrapping.domain.reservation.JobCategory;
import backend.WrappingWrapping.domain.reservation.ModeType;
import backend.WrappingWrapping.domain.reservation.Reservation;
import backend.WrappingWrapping.domain.reservation.dto.ReservationConverter;
import backend.WrappingWrapping.domain.reservation.dto.ReservationRequest;
import backend.WrappingWrapping.domain.reservation.dto.ReservationResponse;
import backend.WrappingWrapping.domain.reservation.dto.ReservationResponse.DetailInfo;
import backend.WrappingWrapping.domain.reservation.repository.ReservationRepository;
import backend.WrappingWrapping.response.exception.GeneralException;
import backend.WrappingWrapping.response.status.ErrorStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;

    public ReservationResponse.DetailInfo getReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id).orElseThrow();
        return DetailInfo.builder()
                .id(reservation.getId())
                .jobCategory(reservation.getJob().toString())
                .modeType(reservation.getMode().toString())
                .scheduledTime(reservation.getScheduledTime())
                .build();
    }

    public ReservationResponse.DetailInfoList search(List<String> jobList, Long userId, LocalDate date,
                                                     Pageable pageable) {
        List<JobCategory> jobEnums =
                (jobList != null && !jobList.isEmpty()) ? jobList.stream().map(JobCategory::to).toList() : null;

        Page<Reservation> result = reservationRepository.findByJobsAndDatePaged(jobEnums, date, LocalDateTime.now(),
                pageable);

        return ReservationConverter.toDetailInfoList(
                result.getContent(),
                userId,
                result.getTotalPages(),
                result.getTotalElements()
        );
    }

    @Transactional
    public void updateReservation(Reservation reservation) {
        reservationRepository.save(reservation);
    }

    public void createReservation(ReservationRequest.CreateDTO request, User creator) {
        List<Reservation> reservations = reservationRepository.findAll().stream()
                .filter(r -> r.getParticipantIds().contains(creator.getId()))
                .collect(Collectors.toList());

        Reservation reservation = Reservation.builder()
                .title(request.getTitle())
                .scheduledTime(request.getScheduledTime())
                .creator(creator)
                .max_participant(request.getMaxParticipant())
                .job(JobCategory.to(request.getJob()))
                .mode(ModeType.to(request.getMode()))
                .build();
        reservation.getParticipantIds().add(creator.getId());
        reservationValidate(reservations, reservation);
        reservation.setActive(false);
        reservationRepository.save(reservation);
    }

    @Transactional
    public void applyToReservation(Long reservationId, Long userId) {
        Reservation reservation = reservationRepository.findById(reservationId).orElseThrow();

        List<Reservation> reservations = reservationRepository.findAll().stream()
                .filter(r -> r.getParticipantIds().contains(userId))
                .collect(Collectors.toList());

        reservationValidate(reservations, reservation);
        reservation.getParticipantIds().add(userId);

        reservationRepository.save(reservation);
    }

    public List<Reservation> getUpcomingReservations() {
        return reservationRepository.findByScheduledTimeBetween(LocalDateTime.now(), LocalDateTime.now().plusDays(1));
    }

    public void delete(Long reservationId, Long userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new GeneralException(ErrorStatus.RESERVATION_NOT_FOUND));
        if (!reservation.getCreator().getId().equals(userId)) {
            throw new GeneralException(ErrorStatus.NOT_RESERVATION_CREATOR);
        }

        reservationRepository.deleteById(reservationId);
    }

    public List<Reservation> getReservationsToActivateSoon() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tenMinutesLater = now.plusMinutes(10);
        return reservationRepository.findByScheduledTimeBetween(now, tenMinutesLater)
                .stream()
                .filter(m -> !m.isActive())
                .collect(Collectors.toList());
    }

    public ReservationResponse.SimpleParticipantsList getParticipants(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new GeneralException(ErrorStatus.RESERVATION_NOT_FOUND));

        return ReservationConverter.toSimpleParticipantsList(reservation.getParticipantIds());
    }

    public ReservationResponse.SimpleScheduledTime getScheduledTime(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new GeneralException(ErrorStatus.RESERVATION_NOT_FOUND));

        return ReservationConverter.toSimpleScheduledTime(reservation.getScheduledTime());
    }

    public ReservationResponse.OrderList getOrder(Long reservationId) {
        Reservation reservation = reservationRepository.findByIdWithOrder(reservationId)
                .orElseThrow(() -> new GeneralException(ErrorStatus.ORDER_NOT_DEFINE));

        return ReservationConverter.toOrderList(reservation.getOrder());
    }

    public ReservationResponse.SimpleInfoList userReservation(Long userId) {
        return ReservationConverter.toSimpleInfoList(reservationRepository.findAll().stream()
                .filter(r -> r.getParticipantIds().contains(userId))
                .collect(Collectors.toList()));
    }

    private static void reservationValidate(List<Reservation> reservations, Reservation newReservation) {
        if (reservations.stream().filter(r -> r.getScheduledTime().isAfter(LocalDateTime.now())).count() >= 3) {
            throw new GeneralException(ErrorStatus.RESERVATION_LIMITED);
        }
        for (Reservation reservation : reservations) {
            LocalDateTime reservedTime = reservation.getScheduledTime();
            LocalDateTime newTime = newReservation.getScheduledTime();
            long minutesDiff = Math.abs(java.time.Duration.between(reservedTime, newTime).toMinutes());
            if (newReservation.getId() == (reservation.getId())) {
                throw new GeneralException(ErrorStatus.ALREADY_PARTICIPANT);
            }
            if (minutesDiff < 90) {
                throw new GeneralException(ErrorStatus.RESERVATION_TIME_DUPLICATED, reservedTime);
            }
        }
    }

    @Transactional
    public void cancelParticipation(Long reservationId, Long userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new GeneralException(ErrorStatus.RESERVATION_NOT_FOUND));

        List<Long> participantIds = reservation.getParticipantIds();
        if (!participantIds.contains(userId)) {
            throw new GeneralException(ErrorStatus.NOT_PARTICIPATING);
        }

        participantIds.remove(userId);

        // 참가자 0명이면 회의 삭제
        if (participantIds.isEmpty()) {
            reservationRepository.delete(reservation);
            return;
        }
        reservation.setParticipantIds(participantIds);
    }


    public ReservationResponse.Basic getReservationBasic(Long id) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new GeneralException(ErrorStatus.RESERVATION_NOT_FOUND));
        return ReservationConverter.toBasic(r);
    }

}