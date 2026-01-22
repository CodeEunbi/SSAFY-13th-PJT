package backend.WrappingWrapping.domain.report.repository;

import backend.WrappingWrapping.domain.report.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    @Query("SELECT r FROM Report r JOIN FETCH r.user WHERE r.user.id = :userId")
    Page<Report> findByUserId(@Param("userId") Long userId, Pageable pageable);

}
