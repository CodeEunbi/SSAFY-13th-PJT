import { FC } from 'react';

interface UserStoryCardProps {
  message: string;
  position: string;
  imageUrl: string;
  direction: 'left' | 'right';
}

const ProfileImage: FC<{ imageUrl: string}> = ({ imageUrl}) => (
  <div className="flex-shrink-0">
    <div className="w-20 sm:w-28 lg:w-32 h-20 sm:h-28 lg:h-32 bg-watermelon bg-opacity-50 rounded-full flex items-center justify-center">
      <img
        src={imageUrl}
        alt={`사용자`}
        className="w-30 sm:w-42 lg:w-48 h-30 sm:h-42 lg:h-48 rounded-full object-cover"
      />
    </div>
  </div>
);

const SpeechBubble: FC<{ 
  message: string; 
  position: string; 
  direction: 'left' | 'right' 
}> = ({ message,position, direction }) => {
  return (
    <div className="relative max-w-sm sm:max-w-xl lg:max-w-3xl">
      <div className={`
        relative bg-my-white text-my-black p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl lg:rounded-3xl
        ${direction === 'left' 
          ? 'before:absolute before:left-0 before:top-1/2 before:w-0 before:h-0 before:border-t-[12px] before:border-b-[12px] before:border-r-[18px] sm:before:border-t-[16px] sm:before:border-b-[16px] sm:before:border-r-[24px] lg:before:border-t-[20px] lg:before:border-b-[20px] lg:before:border-r-[30px] before:border-t-transparent before:border-b-transparent before:border-r-my-white before:-translate-x-full before:-translate-y-1/2'
          : 'before:absolute before:right-0 before:top-1/2 before:w-0 before:h-0 before:border-t-[12px] before:border-b-[12px] before:border-l-[18px] sm:before:border-t-[16px] sm:before:border-b-[16px] sm:before:border-l-[24px] lg:before:border-t-[20px] lg:before:border-b-[20px] lg:before:border-l-[30px] before:border-t-transparent before:border-b-transparent before:border-l-my-white before:translate-x-full before:-translate-y-1/2'
        }
      `}>
        <p className="text-sm sm:text-lg lg:text-xl font-bold leading-relaxed mb-2 sm:mb-3 lg:mb-4">
          {message}
        </p>
        <div className="text-xs sm:text-sm lg:text-sm text-my-light-grey">
          {position}
        </div>
      </div>
    </div>
  );
};

const UserStoryCard: FC<UserStoryCardProps> = ({
  message,
  position,
  imageUrl,
  direction
}) => {
  return (
    <div className={`flex items-center gap-4 sm:gap-8 lg:gap-12 ${direction === 'left' ? '' : 'flex-row-reverse'} mb-16 sm:mb-12 lg:mb-16`}>
      <ProfileImage imageUrl={imageUrl}/>
      <SpeechBubble 
        message={message} 
        position={position} 
        direction={direction} 
      />
    </div>
  );
};

export default UserStoryCard;