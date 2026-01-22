import { FC } from 'react';
import { motion, type Variants } from 'framer-motion';
import LandingSectionHeader from '../../components/common/LandingSectionHeader';
import FeatureCard from '../../components/common/FeatureCard';
import { landingTexts } from '../../types/texts/LandingTexts';

const FeatureSection: FC = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.12,
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
      y: 50,
      opacity: 0,
      rotateY: -8,
      scale: 0.95
    },
    visible: {
      y: 0,
      opacity: 1,
      rotateY: 0,
      scale: 1,
      transition: {
        duration: 0.9,
        type: 'spring',
        stiffness: 70,
        damping: 18,
        ease: [0.16, 1, 0.3, 1]
      },
    },
  };

  const gridVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.15,
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
        margin: "-5% 0px -15% 0px"
      }}
    >
      <motion.div variants={headerVariants}>
        <LandingSectionHeader
          title={
            <>
              <span className="text-watermelon">Pitch</span>:It이 이런 고민을 해결해드립니다!
              <br />
            </>
          }
        />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="m-4 lg:mt-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-6 lg:gap-4"
            variants={gridVariants}
          >
            {landingTexts.features.map((feature, index) => (
              <motion.div
                key={index}
                className={index === 2 ? 'md:col-span-2 lg:col-span-1' : ''}
                style={{ transformPerspective: 800 }}
                variants={cardVariants}
                whileHover={{
                  scale: 1.05,
                  y: -10,
                  rotateY: 5,
                  transition: {
                    duration: 0.3,
                    ease: 'easeOut' as const,
                  },
                }}
                whileTap={{ scale: 0.95 }}
              >
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  subtitle={feature.subtitle}
                  features={feature.features}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default FeatureSection;
