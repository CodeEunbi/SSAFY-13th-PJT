package backend.WrappingWrapping.domain.report.controller;

import backend.WrappingWrapping.domain.member.User;
import backend.WrappingWrapping.domain.report.dto.ReportResponse.DetailInfoDTO;
import backend.WrappingWrapping.domain.report.dto.ReportResponse.DetailListResponse;
import backend.WrappingWrapping.domain.report.service.ReportService;
import backend.WrappingWrapping.global.auth.LoginMember;
import backend.WrappingWrapping.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Validated
public class ReportController {
    private final ReportService reportService;
    

    @GetMapping
    public ApiResponse<DetailListResponse> getReportList(
            @LoginMember User user,
            @PageableDefault(size = 5, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Long userId = user.getId();
        return ApiResponse.onSuccess(reportService.getReportList(userId, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<DetailInfoDTO> getReportDetail(
            @PathVariable @Positive(message = "ID는 양수여야 합니다") Long id, 
            @LoginMember User user) {
        Long userId = user.getId();
        return ApiResponse.onSuccess(reportService.getReportDetail(id, userId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteReport(
            @PathVariable @Positive(message = "ID는 양수여야 합니다") Long id, 
            @LoginMember User user) {
        Long userId = user.getId();
        reportService.delete(id, userId);
        return ApiResponse.OK;
    }
}