import { FC } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import UserStoryCard from '../../components/common/UserStoryCard';
import LandingSectionHeader from '../../components/common/LandingSectionHeader';
import { landingTexts } from '../../types/texts/LandingTexts';

const UserStorySection: FC = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.15,
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
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { 
      scale: 0.9, 
      opacity: 0,
      y: 40
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1],
        type: "spring",
        stiffness: 60,
        damping: 15
      },
    },
  };

  return (
    <motion.section
      className="min-h-0 lg:min-h-screen justify-center py-8 sm:py-12 lg:py-20 select-none"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ 
        once: false, 
        amount: 0.1,
        margin: "-10% 0px -10% 0px"
      }}
    >
      <motion.div variants={headerVariants}>
        <LandingSectionHeader title="혼자 연습하다 보면, 나만 부족한 것 같아 불안하죠" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-8 lg:mt-16">
          {landingTexts.userstories.map((userstory, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
            >
              <UserStoryCard
                message={userstory.message}
                position={userstory.position}
                imageUrl={userstory.imageUrl}
                direction={userstory.direction}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default UserStorySection;
