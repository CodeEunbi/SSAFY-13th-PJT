package backend.WrappingWrapping.domain.reservation.repository;

import backend.WrappingWrapping.domain.reservation.JobCategory;
import backend.WrappingWrapping.domain.reservation.Reservation;
import io.lettuce.core.dynamic.annotation.Param;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

// MeetingRepository
@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    @Query("SELECT r FROM Reservation r WHERE r.scheduledTime BETWEEN :start AND :end")
    List<Reservation> findByScheduledTimeBetween(LocalDateTime start, LocalDateTime end);

    List<Reservation> findByIsActive(boolean isActive);

    List<Reservation> findByCreatorId(Long creatorId);

    @Query("SELECT r FROM Reservation r WHERE r.id = :id")
    Optional<Reservation> findByIdWithOrder(@Param("id") Long id);

    @Query("""
                SELECT r FROM Reservation r WHERE (:jobs IS NULL OR r.job IN :jobs)
                  AND (:date IS NULL OR FUNCTION('DATE', r.scheduledTime) = :date)
                  AND r.scheduledTime > :now
            """)
    Page<Reservation> findByJobsAndDatePaged(@Param("jobs") List<JobCategory> jobs,
                                             @Param("date") LocalDate date,
                                             @Param("now") LocalDateTime now,
                                             Pageable pageable);
}