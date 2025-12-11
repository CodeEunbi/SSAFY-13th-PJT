import FilledButton from '../../components/common/FilledButton';
import LinedButton from '../../components/common/LinedButton';
import { theme } from '../../styles/theme';

interface RoomListMobileViewProps {
  date: string;
  time: string;
  job: string;
  title: string;
  participants: string;
  inActive: boolean;
  isParticipanted: boolean;
  onclick?: () => void;
}

const RoomListMobileView = ({
  date,
  time,
  job,
  title,
  participants,
  inActive,
  isParticipanted,
  onclick = () => alert('Room clicked'),
}: RoomListMobileViewProps) => {
  return (
    <div>
      <div className={`hover:bg-${theme.primary} hover:bg-opacity-30 p-3 `}>
        <div className={`flex gap-6 justify-between items-center`}>
          <div className={`flex flex-col flex-grow gap-2`}>
            <div className={`flex justify-between`}>
              <div className={`flex flex-grow gap-2 text-${theme.myLightGrey}`}>
                <div className="">{date}</div>
                <div className="">{time}</div>
              </div>
              <div className={`text-${theme.myLightGrey} text-sm`}>
                {participants}
              </div>
            </div>
            <div className={`grid grid-cols-[1fr_2fr] gap-1`}>
              <div className="truncate font-bold">{job}</div>
              <div className="truncate">{title}</div>
            </div>
          </div>
          <div className={`flex-shrink-0`}>
            {inActive ? (
              isParticipanted ? (
                <FilledButton label="참여" disabled={true} size="px-3 py-1" />
              ) : (
                <FilledButton
                  label="예약"
                  onClick={onclick}
                  disabled={false}
                  size="px-3 py-1"
                />
              )
            ) : (
              <LinedButton label="예약" disabled={true} size="py-1 px-3" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomListMobileView;
