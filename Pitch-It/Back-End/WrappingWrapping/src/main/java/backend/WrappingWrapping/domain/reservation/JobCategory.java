package backend.WrappingWrapping.domain.reservation;

import backend.WrappingWrapping.response.exception.GeneralException;
import backend.WrappingWrapping.response.status.ErrorStatus;

public enum JobCategory {
    MANAGEMENT,
    MARKETING,
    TRADE,
    DEVELOPER,
    MANUFACTURING,
    CONSTRUCTION,
    SALES,
    FINANCE,
    MEDIA,
    DESIGN;

    public static JobCategory to(String value) {
        try {
            return JobCategory.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new GeneralException(ErrorStatus.JOB_CATEGORY_INVALID_DATA, value);
        }
    }
}
