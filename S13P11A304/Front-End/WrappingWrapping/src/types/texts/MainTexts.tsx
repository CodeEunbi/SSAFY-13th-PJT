import { theme } from '../../styles/theme';

export const bannerTexts = {
  bannerMessage: (
    <div className="font-semibold text-xl">
      합격 그 이상의 목표를 가진 당신의 도전에, 가장 확실한 준비를 더하는 곳
      <br />
      지금{' '}
      <span className="font-extrabold">
        <span className={`text-${theme.primary}`}>Pitch</span>:It
      </span>{' '}
      으로 면접을 함께 준비해보세요.
    </div>
  ),
};

export const filterTexts = {
  jobFilterLabel: '직무 선택',
};

export const roomListTexts = {
  date: '날짜',
  time: '시간',
  job: '직무',
  title: '제목',
  participants: '인원',
  reservation: '예약',
};
