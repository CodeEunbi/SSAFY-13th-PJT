package backend.WrappingWrapping.domain.livekit.controller;

import backend.WrappingWrapping.domain.livekit.dto.LivekitRequest;
import backend.WrappingWrapping.response.ApiResponse;
import backend.WrappingWrapping.response.status.ErrorStatus;
import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import io.livekit.server.WebhookReceiver;
import livekit.LivekitWebhook.WebhookEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*")
@RestController
public class SignalController {

    @Value("${livekit.api.key}")
    private String LIVEKIT_API_KEY;

    @Value("${livekit.api.secret}")
    private String LIVEKIT_API_SECRET;

    @PostMapping(value = "/token")
    public ApiResponse<?> createToken(@RequestBody LivekitRequest request) {
        String roomId = request.getRoomId();
        String participantId = request.getParticipantId();

        if (roomId == null || participantId == null) {
            return ApiResponse.onFailure(ErrorStatus.BAD_REQUEST, "roomId or participantId is null");
        }

        AccessToken token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
        token.setName(participantId);
        token.setIdentity(participantId);
        token.addGrants(new RoomJoin(true), new RoomName(roomId));

        return ApiResponse.onSuccess(token.toJwt());
    }

    @PostMapping(value = "/livekit/webhook", consumes = "application/webhook+json")
    public ResponseEntity<String> receiveWebhook(@RequestHeader("Authorization") String authHeader,
                                                 @RequestBody String body) {
        WebhookReceiver webhookReceiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
        try {
            WebhookEvent event = webhookReceiver.receive(body, authHeader);
            System.out.println("LiveKit Webhook: " + event.toString());
        } catch (Exception e) {
            System.err.println("Error validating webhook event: " + e.getMessage());
        }
        return ResponseEntity.ok("ok");
    }

}