package backend.SSAFY_PTJ2.adapter.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ErrorSocketDto {
	private boolean isError;
	private String errorCode;
	private String message;
}
