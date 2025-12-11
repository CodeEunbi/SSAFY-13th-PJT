import { FC, ReactNode } from 'react';

import LogoText from '../../assets/images/logo_text.png';

interface SectionHeaderProps {
  title: ReactNode;
  text?: string;
  showLogo?: boolean;
}

const LandingSectionHeader: FC<SectionHeaderProps> = ({
  title,
  text,
  showLogo = true,
}) => {
  const renderLogo = () => (
    <div className="m-6">
      <img src={LogoText} alt="Pitch:It 로고" className="mx-auto h-5" />
    </div>
  );

  const renderTitle = () => (
    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
      {title}
    </h2>
  );

  const renderText = () => (
    <p className="m-4 sm:m-6 lg:m-8 text-lg sm:text-xl lg:text-2xl font-bold">
      {text}
    </p>
  );

  return (
    <section>
      <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        {showLogo && renderLogo()}
        {renderTitle()}
        {text && renderText()}
      </div>
    </section>
  );
};

export default LandingSectionHeader;
