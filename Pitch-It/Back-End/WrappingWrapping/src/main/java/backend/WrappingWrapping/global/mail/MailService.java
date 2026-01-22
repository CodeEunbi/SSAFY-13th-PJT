package backend.WrappingWrapping.global.mail;

import backend.WrappingWrapping.response.exception.GeneralException;
import backend.WrappingWrapping.response.status.ErrorStatus;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class MailService {
    private final JavaMailSender mailSender;

    public void sendMeetingInvitation(String toEmail, String meetingUrl, String meetingTitle, String scheduledTime) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("[Pitch-It] " + meetingTitle + " 회의 시작 알림");
            helper.setText(
                    "<div style='max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;'>" +
                            "<div style='background: #FC6C86; color: white; padding: 20px; text-align: center;'>" +
                            "<h1 style='margin: 0;'>Pitch-It</h1>" +
                            "</div>" +

                            "<div style='padding: 30px 20px; background: white;'>" +
                            "<h2>예약하신 회의방이 곧 시작됩니다!</h2>" +
                            "<p>안녕하세요! 아래 정보를 확인하시고 시간에 맞춰 참여해주세요.<br>" +
                            "자신감 있게 임하세요. Pitch-It이 응원합니다!</p>" +

                            "<div style='background: #f8f9fa; padding: 20px; margin: 20px 0;'>" +
                            "<p><strong>회의명:</strong> " + meetingTitle + "</p>" +
                            "<p><strong>시작 시간:</strong> " + scheduledTime + "</p>" +
                            "</div>" +

                            "<div style='text-align: center; margin: 25px 0;'>" +
                            "<a href='" + meetingUrl + "' style='background: #FC6C86; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;'>" +
                            "회의방 입장하기" +
                            "</a>" +
                            "</div>" +

                            "<p><strong>참고사항</strong></p>" +
                            "<p>• 마이크와 카메라를 미리 확인해주세요<br>" +
                            "• 안정적인 인터넷 환경에서 참여해주세요</p>" +
                            "</div>" +

                            "<div style='background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;'>" +
                            "이 메일은 Pitch-It에서 자동으로 발송되었습니다.<br>" +
                            "© 2025 WrappingWrapping. All rights reserved." +
                            "</div>" +
                            "</div>",
                    true
            );

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new GeneralException(ErrorStatus.MAIL_SEND_FAIL);
        }
    }
}
