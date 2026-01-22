// src/components/room/RequirementDisplay.tsx

import Timer from '../common/Timer';
import ButtonWithIcon from '../common/ButtonWithIcon';
import ExitIcon from '../../assets/icons/exit.svg';

interface RequirementDisplayProps {
  room: {
    question: string | null;
    situation: string | null;
    requirements: string | null;
  };
  endTime: string;
  onSkip: () => void;
  onExpire?: () => void;
  onLeave?: () => void; // 방 나가기 함수 추가
}

const RequirementDisplay = ({
  room,
  endTime,
  onSkip,
  onLeave,
}: RequirementDisplayProps) => {
  const exitMeeting = () => {
    // Context에서 전달받은 방 나가기 함수 호출
    if (onLeave) {
      onLeave();
    }
  };

  return (
    <div>
      <div className="sticky top-0 h-24 bg-my-black flex justify-between items-center px-8">
        <div className="bg-watermelon rounded-3xl min-w-24 px-4 py-2 text-my-black text-center font-bold text-xl">
          <Timer endTime={endTime} onExpire={onSkip} />
        </div>
        <ButtonWithIcon onClick={exitMeeting}>
          <img src={ExitIcon} alt="Exit" className="w-7 h-7" />
        </ButtonWithIcon>
      </div>
      <div className="px-8 py-2 mb-8 flex flex-col">
        {/* 컨텐츠 영역 */}
        <div className="flex flex-col flex-1 gap-8">
          {room.question && (
            <div className="bg-black/30 p-6 rounded-2xl">
              <h2 className="text-2xl font-semibold mb-4 text-watermelon">
                문제
              </h2>
              <p className="text-lg leading-relaxed">{room.question}</p>
            </div>
          )}

          {room.situation && (
            <div className="bg-black/30 p-6 rounded-2xl">
              <h2 className="text-2xl font-semibold mb-4 text-watermelon">
                상황
              </h2>
              <p className="text-lg leading-relaxed">{room.situation}</p>
            </div>
          )}

          {room.requirements && (
            <div className="bg-black/30 p-6 rounded-2xl">
              <h2 className="text-2xl font-semibold mb-4 text-watermelon">
                제약조건
              </h2>
              <p className="text-lg leading-relaxed">{room.requirements}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequirementDisplay;
