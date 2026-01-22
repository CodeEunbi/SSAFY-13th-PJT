import { FC } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { landingTexts } from '../../types/texts/LandingTexts';
import FilledButton from '../../components/common/FilledButton';

import LogoImage from '../../assets/images/logo_image.png';

const HeroSection: FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.5,
        staggerChildren: 0.4
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut" as const
      }
    }
  };

  return (
    <div className="min-h-0 sm:min-h-screen flex justify-center pt-8 sm:pt-16 lg:pt-16 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div 
          className="mt-6 p-4 sm:p-8 grid gap-8 grid-cols-1 md:grid-cols-[2fr_1fr] lg:grid-cols-[2fr_1fr] md:gap-12 lg:gap-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div>
            <motion.div 
              className="mb-4 text-5xl sm:text-7xl lg:text-9xl font-extrabold"
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
            >
              {landingTexts.heroName}
            </motion.div>

            <motion.div 
              className="mb-8 lg:mb-12 text-2xl sm:text-3xl lg:text-4xl font-bold"
              variants={itemVariants}
            >
              {landingTexts.heroTitle}
            </motion.div>

            <motion.div 
              className="mb-8 lg:mb-12 text-base sm:text-xl lg:text-2xl"
              variants={itemVariants}
            >
              {landingTexts.heroDescription.map((line, index) => (
                <motion.div 
                  key={index} 
                  className={index > 0 ? 'mt-2' : ''}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 + index * 0.2 }}
                >
                  {line}
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FilledButton
                label="지금 연습하러 가기"
                onClick={() => navigate('/main')}
                size="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-base sm:text-lg lg:text-xl font-bold"
              />
            </motion.div>
          </div>

          <div className="hidden md:flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 1.8,
                delay: 1.2,
                ease: "easeOut"
              }}
            >
              <motion.img
                src={LogoImage}
                alt="Pitch:It 복숭아 로고"
                className="w-60 sm:w-72 lg:w-80 h-60 sm:h-72 lg:h-80 object-contain drop-shadow-2xl"
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                whileHover={{
                  scale: 1.1,
                  rotate: 10,
                  transition: { duration: 0.3 }
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
