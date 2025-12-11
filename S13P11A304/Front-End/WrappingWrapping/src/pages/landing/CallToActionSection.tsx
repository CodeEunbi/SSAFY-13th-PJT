import { FC } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LandingSectionHeader from '../../components/common/LandingSectionHeader';
import FilledButton from '../../components/common/FilledButton';

import LogoText from '../../assets/images/logo_text.png';
import LogoImage from '../../assets/images/logo_image.png';

const CallToActionSection: FC = () => {
  const navigate = useNavigate();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.3,
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      },
    },
  };

  const headerVariants: Variants = {
    hidden: {
      y: -30,
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 60,
        damping: 15,
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1]
      },
    },
  };

  const buttonVariants: Variants = {
    hidden: {
      scale: 0.9,
      opacity: 0,
      y: 20,
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 70,
        damping: 18,
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1]
      },
    },
  };

  return (
    <motion.section
      className="min-h-0 lg:min-h-screen flex flex-col justify-between py-8 sm:py-12 lg:py-20 select-none"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ 
        once: false, 
        amount: 0.1,
        margin: "-10% 0px -10% 0px"
      }}
    >
      <motion.div
        className="bg-black bg-opacity-15 py-16 sm:py-24 lg:py-32 text-center"
        whileHover={{
          backgroundColor: 'rgba(0,0,0,0.2)',
          transition: { duration: 0.3 },
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={headerVariants}>
            <LandingSectionHeader
              title={
                <>
                  지금 바로 <span className="text-watermelon">Pitch</span>:It과
                  함께
                  <br />
                  실전처럼 연습하고, AI 피드백으로 성장하세요
                </>
              }
              text="여러분의 떨리는 첫 한마디, 그 용기 있는 시작을 Pitch:It이 옆에서 응원할게요!"
              showLogo={false}
            />
          </motion.div>

          <motion.div
            className="mt-8 sm:mt-12 lg:mt-16"
            variants={buttonVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FilledButton
              label="바로 시작하기"
              onClick={() => navigate('/login')}
              size="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-base sm:text-lg lg:text-xl font-bold"
            />
          </motion.div>
        </div>
      </motion.div>

      <div className="text-center mt-16 sm:mt-12 lg:mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img
              src={LogoImage}
              alt="Pitch:It 로고"
              className="w-5 sm:w-6 h-5 sm:h-6"
            />
            <img src={LogoText} alt="Pitch:It" className="h-4 sm:h-5" />
          </div>
          <div className="w-4/5 mx-auto border-t border-watermelon pt-4">
            <div className="text-sm sm:text-base">Copyright Wrapping Wrapping</div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default CallToActionSection;
