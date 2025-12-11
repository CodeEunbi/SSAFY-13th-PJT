package backend.WrappingWrapping.domain.report.service;

import backend.WrappingWrapping.domain.report.Report;
import backend.WrappingWrapping.domain.report.dto.ReportConverter;
import backend.WrappingWrapping.domain.report.dto.ReportResponse;
import backend.WrappingWrapping.domain.report.repository.ReportRepository;
import backend.WrappingWrapping.response.exception.GeneralException;
import backend.WrappingWrapping.response.status.ErrorStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository repository;
    private final ReportConverter reportConverter;


    @Transactional(readOnly = true)
    public ReportResponse.DetailListResponse getReportList(Long userId, Pageable pageable) {
        Page<Report> reportPage = repository.findByUserId(userId, pageable);
        return reportConverter.toListResponse(reportPage.getContent(), reportPage.getTotalPages(), reportPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ReportResponse.DetailInfoDTO getReportDetail(Long id, Long userId){

        Report report = repository.findById(id)
                .orElseThrow(() -> new GeneralException(ErrorStatus.REPORT_NOT_FOUND));

        if (!Objects.equals(report.getUser().getId(), userId)) {
            throw new GeneralException(ErrorStatus.FORBIDDEN);
        }

        return reportConverter.toDetailResponse(report);
    }

    @Transactional
    public void delete(Long id, Long userId){

        Report report = repository.findById(id)
                .orElseThrow(() -> new GeneralException(ErrorStatus.REPORT_NOT_FOUND));

        if (!Objects.equals(report.getUser().getId(), userId)) {
            throw new GeneralException(ErrorStatus.FORBIDDEN);
        }
        repository.delete(report);
    }
}