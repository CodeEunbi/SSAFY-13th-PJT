import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FilledButton from '../../components/common/FilledButton';
import { findLabelByValue } from '../../utils/roomUtils';

interface ReservationCardProps {
  id: number;
  date: string; // 화면 표시용 문자열 (외부에서 포맷해서 전달)
  job: string;
  title: string;
  scheduledTime: string; // ISO string (예: "2025-08-15T14:30:00")
  onCancel: (id: number) => void;
  onHide?: (id: number) => void; // 카드가 숨겨질 때 부모에 알림
}

export default function ReservationCard({
  id,
  date,
  job,
  title,
  scheduledTime,
  onCancel,
  onHide,
}: ReservationCardProps) {
  const [buttonState, setButtonState] = useState<'cancel' | 'enter'>('cancel');
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const scheduledRounded = new Date(scheduledTime);
    scheduledRounded.setSeconds(0, 0);

    const scheduledHide = new Date(scheduledTime);
    scheduledHide.setSeconds(0, 0);
    scheduledHide.setMinutes(scheduledHide.getMinutes() + 1);

    const TEN_MIN = 10 * 60 * 1000;

    const tick = () => {
      const nowMs = Date.now();
      const roundedMs = scheduledRounded.getTime();
      const hideMs = scheduledHide.getTime();

      if (nowMs >= hideMs) {
        setIsVisible(false);
        return;
      }

      if (nowMs >= roundedMs - TEN_MIN) {
        setButtonState('enter');
      } else {
        setButtonState('cancel');
      }
    };

    tick();
    const itv = setInterval(tick, 1000);
    return () => clearInterval(itv);
  }, [scheduledTime]);

  useEffect(() => {
    if (!isVisible && onHide) onHide(id);
  }, [isVisible, onHide, id]);

  const handleButtonClick = () => {
    if (buttonState === 'cancel') {
      onCancel(id);
    } else if (buttonState === 'enter') {
      navigate(`/waiting/${id}`);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="border border-watermelon rounded-2xl p-6 h-32 relative">
      <div className="h-full flex items-center">
        <div className="text-left">
          <p className="text-sm">{date}</p>
          <p className="text-sm break-words">{title}</p>
          <p className="font-medium">직무 : {findLabelByValue(job)}</p>
        </div>
      </div>

      <div className="absolute bottom-4 right-6">
        <FilledButton
          onClick={handleButtonClick}
          label={buttonState === 'cancel' ? '취소' : '입장'}
          size="px-2 py-1"
        />
      </div>
    </div>
  );
}
