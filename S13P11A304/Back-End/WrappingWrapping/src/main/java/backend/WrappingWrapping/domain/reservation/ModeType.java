package backend.WrappingWrapping.domain.reservation;

import backend.WrappingWrapping.response.exception.GeneralException;
import backend.WrappingWrapping.response.status.ErrorStatus;

public enum ModeType {
    PT;

    public static ModeType to(String value) {
        try {
            return ModeType.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new GeneralException(ErrorStatus.MODE_TYPE_INVALID_DATA, value);
        }
    }
}
