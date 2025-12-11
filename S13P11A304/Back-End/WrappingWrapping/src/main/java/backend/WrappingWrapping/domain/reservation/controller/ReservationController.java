package backend.WrappingWrapping.domain.reservation.controller;

import backend.WrappingWrapping.domain.member.User;
import backend.WrappingWrapping.domain.reservation.Reservation;
import backend.WrappingWrapping.domain.reservation.dto.ReservationRequest;
import backend.WrappingWrapping.domain.reservation.dto.ReservationResponse.DetailInfoList;
import backend.WrappingWrapping.domain.reservation.dto.ReservationResponse.OrderList;
import backend.WrappingWrapping.domain.reservation.dto.ReservationResponse.SimpleParticipantsList;
import backend.WrappingWrapping.domain.reservation.dto.ReservationResponse.SimpleScheduledTime;
import backend.WrappingWrapping.domain.reservation.service.ReservationService;
import backend.WrappingWrapping.global.auth.LoginMember;
import backend.WrappingWrapping.response.ApiResponse;
import backend.WrappingWrapping.response.exception.GeneralException;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reservations")
public class ReservationController {
    private final ReservationService reservationService;

    @GetMapping
    public ApiResponse<DetailInfoList> getReservations(
            @RequestParam(required = false) List<String> jobs,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @PageableDefault(size = 12, sort = "scheduledTime", direction = Sort.Direction.ASC) Pageable pageable,
            @LoginMember User user
    ) {
        return ApiResponse.onSuccess(reservationService.search(jobs, user.getId(), date, pageable));
    }

    @PostMapping
    public ApiResponse<?> create(@RequestBody ReservationRequest.CreateDTO reservation, @LoginMember User user) {
        try {
            reservationService.createReservation(reservation, user);
            return ApiResponse.OK;
        } catch (GeneralException e) {
            return ApiResponse.onFailure(e.getErrorStatus(), e.getData());
        }
    }

    @DeleteMapping("/{reservation_id}")
    public ApiResponse<?> delete(@PathVariable("reservation_id") Long reservation_id, @LoginMember User user) {
        try {
            reservationService.delete(reservation_id, user.getId());
            return ApiResponse.OK;
        } catch (GeneralException e) {
            return ApiResponse.onFailure(e.getErrorStatus(), e.getMessage());
        }
    }

    @PostMapping("/{reservation_id}")
    public ApiResponse<?> apply(@PathVariable Long reservation_id, @LoginMember User user) {
        try {
            reservationService.applyToReservation(reservation_id, user.getId());
            return ApiResponse.OK;
        } catch (GeneralException e) {
            return ApiResponse.onFailure(e.getErrorStatus(), e.getMessage());
        }
    }

    @Transactional
    @GetMapping("/upcoming")
    public ApiResponse<List<Reservation>> getUpcomingReservations() {
        return ApiResponse.onSuccess(reservationService.getUpcomingReservations());
    }

    @GetMapping("/order/{reservation_id}")
    public ApiResponse<?> getOrder(@PathVariable Long reservation_id) {
        try {
            OrderList order = reservationService.getOrder(reservation_id);
            return ApiResponse.onSuccess(order);
        } catch (GeneralException e) {
            return ApiResponse.onFailure(e.getErrorStatus(), e.getMessage());
        }
    }

    @Transactional
    @GetMapping("/{reservation_id}")
    public ApiResponse<SimpleParticipantsList> getParticipants(@PathVariable Long reservation_id) {
        return ApiResponse.onSuccess(reservationService.getParticipants(reservation_id));
    }

    @Transactional
    @GetMapping("/time/{reservation_id}")
    public ApiResponse<SimpleScheduledTime> getScheduledTime(@PathVariable Long reservation_id) {
        return ApiResponse.onSuccess(reservationService.getScheduledTime(reservation_id));
    }

    @DeleteMapping("/cancel/{reservationId}")
    public ApiResponse<?> cancelParticipation(@PathVariable Long reservationId,
                                              @LoginMember User user) {
        Long userId = user.getId();
        reservationService.cancelParticipation(reservationId, userId);
        return ApiResponse.OK;
    }

    @GetMapping("/detail/{reservation_id}")
    public ApiResponse<backend.WrappingWrapping.domain.reservation.dto.ReservationResponse.Basic>
    getReservationBasic(@PathVariable("reservation_id") Long reservationId) {
        return ApiResponse.onSuccess(reservationService.getReservationBasic(reservationId));
    }

}
