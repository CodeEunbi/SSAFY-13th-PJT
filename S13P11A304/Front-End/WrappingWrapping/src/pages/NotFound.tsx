import { FC, useState, useEffect } from 'react';
import { theme } from '../styles/theme';
import { notFoundTexts } from '../types/texts/404Texts';
import LinedButton from '../components/common/LinedButton';
import { useNavigate } from 'react-router-dom';

const NotFound: FC = () => {
  const navigate = useNavigate();
  const [svgContent, setSvgContent] = useState('');

  useEffect(() => {
    fetch(`/src/assets/icons/404Icon.svg?t=${Date.now()}`)
      .then((response) => response.text())
      .then((svg) => setSvgContent(svg));
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-col items-center justify-center h-full">
        <div className="flex flex-col items-center md:items-start md:flex-row py-12 gap-2 md:gap-12 w-full justify-center bg-black/20">
          <div
            className="max-w-[200px] flex items-center justify-center md:mt-3"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
          <div className="flex flex-col items-center md:items-start justify-center">
            <h1 className={`text-6xl font-extrabold text-${theme.primary}`}>
              {notFoundTexts.code}
            </h1>
            <div className={`text-xl my-4 text-${theme.primary}`}>
              {notFoundTexts.title}
            </div>
            <div className={`font-thin text-center md:text-left`}>
              {notFoundTexts.content.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            <LinedButton
              label="메인 페이지로 돌아가기"
              onClick={() => navigate('/')}
              size="py-1 px-5 mt-6 md:mt-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
