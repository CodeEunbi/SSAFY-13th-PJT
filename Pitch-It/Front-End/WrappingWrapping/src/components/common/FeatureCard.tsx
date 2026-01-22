import { FC } from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  subtitle: string;
  features: string[];
}

const FeatureCard: FC<FeatureCardProps> = ({ icon, title, subtitle, features }) => {
  return (
    <div className="bg-my-white rounded-xl sm:rounded-2xl p-6 sm:p-6 lg:p-8">
      <div className="flex justify-center mb-4 sm:mb-6 lg:mb-8">
        <div className="w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 bg-watermelon/10 rounded-xl sm:rounded-2xl flex items-center justify-center">
          <img src={icon} alt={title} className="max-w-8 sm:max-w-9 lg:max-w-10 max-h-8 sm:max-h-9 lg:max-h-10 object-contain" />
        </div>
      </div>
      
      <h3 className="text-lg sm:text-xl lg:text-xl font-bold text-my-black text-center mb-1 sm:mb-2">
        {title}
      </h3>
      
      <p className="text-watermelon text-center mb-4 sm:mb-5 lg:mb-6 font-bold text-sm sm:text-base">
        {subtitle}
      </p>
      
      <ul className="space-y-2 sm:space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-my-light-grey rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
            <span className="text-my-black font-bold leading-relaxed text-sm sm:text-base">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FeatureCard;