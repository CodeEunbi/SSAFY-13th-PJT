package backend.WrappingWrapping.domain.member.controller;

import backend.WrappingWrapping.domain.member.User;
import backend.WrappingWrapping.domain.member.dto.UserRequest;
import backend.WrappingWrapping.domain.member.dto.UserResponse.DetailInfoDTO;
import backend.WrappingWrapping.domain.member.dto.UserResponse.UpdateResponse;
import backend.WrappingWrapping.domain.member.service.UserService;
import backend.WrappingWrapping.domain.reservation.dto.ReservationResponse.SimpleInfoList;
import backend.WrappingWrapping.domain.reservation.service.ReservationService;
import backend.WrappingWrapping.global.auth.LoginMember;
import backend.WrappingWrapping.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;
    private final ReservationService reservationService;

    @GetMapping
    public ApiResponse<DetailInfoDTO> getMyInfo(@LoginMember User user) {
        DetailInfoDTO response = userService.getUser(user.getId());
        return ApiResponse.onSuccess(response);
    }

    @DeleteMapping
    public ApiResponse<Void> deleteUser(@LoginMember User user) {
        userService.delete(user.getId());
        return ApiResponse.OK;
    }

    @PatchMapping
    public ApiResponse<UpdateResponse> updateUser(
            @LoginMember User user,
            @RequestBody @Valid UserRequest.updateDTO request) {
        UpdateResponse updateResponse = userService.updateUser(user.getId(), request);
        return ApiResponse.onSuccess(updateResponse);
    }

    @GetMapping("/reservations")
    public ApiResponse<SimpleInfoList> getReservations(@LoginMember User user) {
        return ApiResponse.onSuccess(reservationService.userReservation(user.getId()));
    }
}
