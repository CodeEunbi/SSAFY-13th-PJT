package backend.WrappingWrapping.domain.report.dto;


import backend.WrappingWrapping.domain.report.Report;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ReportConverter {
    public ReportResponse.DetailListResponse toListResponse(List<Report> reports, int totalPages, long totalElements) {
        List<ReportResponse.DetailListDTO> reportDTOs = reports.stream()
                .map(report -> ReportResponse.DetailListDTO.builder()
                        .id(report.getId())
                        .meetingAt(report.getMeetingAt())
                        .job(report.getJob().name())
                        .mode(report.getMode().name())
                        .title(report.getTitle())
                        .createdAt(report.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ReportResponse.DetailListResponse.builder()
                .reports(reportDTOs)
                .totalPages(totalPages)
                .totalElements(totalElements)
                .build();
    }


    public ReportResponse.DetailInfoDTO toDetailResponse(Report report) {
        return ReportResponse.DetailInfoDTO.builder()
                .id(report.getId())
                .meetingAt(report.getMeetingAt())
                .job(report.getJob().name())
                .mode(report.getMode().name())
                .title(report.getTitle())
                .situation(report.getSituation())
                .requirements(report.getRequirements())
                .question(report.getQuestion())
                .content(report.getContent())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
