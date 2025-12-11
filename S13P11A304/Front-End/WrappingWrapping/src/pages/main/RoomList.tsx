import { useId, useRef, useEffect, useState } from 'react';
import FilledButton from '../../components/common/FilledButton';
import LinedButton from '../../components/common/LinedButton';
import { RoomListProps } from '../../types/interfaces/mainPage';
import { theme } from '../../styles/theme';
import { Tooltip } from 'react-tooltip';

const RoomList = ({
  date,
  time,
  job,
  title,
  participants,
  inActive,
  isParticipanted,
  onclick = () => alert('Room clicked'),
}: RoomListProps) => {
  const tooltipId = useId();
  const jobRef = useRef<HTMLDivElement>(null);
  const [isJobTruncated, setIsJobTruncated] = useState(false);

  useEffect(() => {
    if (jobRef.current) {
      const isOverflowing =
        jobRef.current.scrollWidth > jobRef.current.clientWidth;
      setIsJobTruncated(isOverflowing);
    }
  }, [job]);

  return (
    <div>
      <div
        className={`sm:grid sm:grid-cols-[80px_40px_1fr_3fr_40px_50px] sm:gap-6
              justify-center items-center p-3
              hover:bg-${theme.primary} hover:bg-opacity-20
              `}
      >
        <div className="text-center">{date}</div>
        <div className="text-center font-semibold">{time}</div>
        <div
          ref={jobRef}
          className="text-center font-semibold truncate"
          data-tooltip-id={isJobTruncated ? tooltipId : undefined}
        >
          {job}
        </div>
        {isJobTruncated && (
          <Tooltip
            id={tooltipId}
            content={job}
            place="top"
            className={`bg-${theme.myBlack} text-${theme.myWhite} text-sm`}
          />
        )}
        <div className="truncate">{title}</div>
        <div className="text-center">{participants}</div>
        {inActive ? (
          isParticipanted ? (
            <FilledButton label="참여" disabled={true} size="py-1 text-sm" />
          ) : (
            <FilledButton
              label="예약"
              onClick={onclick}
              disabled={false}
              size="py-1 text-sm"
            />
          )
        ) : (
          <LinedButton label="예약" disabled={true} size="py-1 px-2 text-sm" />
        )}
      </div>
    </div>
  );
};

export default RoomList;
