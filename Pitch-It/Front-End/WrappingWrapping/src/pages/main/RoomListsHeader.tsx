import { theme } from '../../styles/theme';
import { roomListTexts } from '../../types/texts/MainTexts';

interface RoomListsHeaderProps {
  display: string;
}

const RoomListsHeader = ({ display }: RoomListsHeaderProps) => {
  return (
    <div className={display}>
      <div
        className={`sm:grid sm:grid-cols-[80px_40px_1fr_3fr_40px_50px] sm:gap-6
            text-${theme.myLightGrey} text-[15px] font-thin px-3
        `}
      >
        <div className="text-center">{roomListTexts.date}</div>
        <div className="text-center">{roomListTexts.time}</div>
        <div className="text-center">{roomListTexts.job}</div>
        <div className="text-center">{roomListTexts.title}</div>
        <div className="text-center">{roomListTexts.participants}</div>
        <div className="text-center">{roomListTexts.reservation}</div>
      </div>
      <hr className={`mb-3 mt-5 border-${theme.myWhite}`}></hr>
    </div>
  );
};

export default RoomListsHeader;
