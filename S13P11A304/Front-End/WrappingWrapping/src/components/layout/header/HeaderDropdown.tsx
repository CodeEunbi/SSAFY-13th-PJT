import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../../../styles/theme';
import { headerTexts } from '../../../types/texts/HeaderTexts';
import HeaderDropdownItem from './HeaderDropdownItem';
import { useNavigate } from 'react-router-dom';
import apiController from '../../../api/apiController';
import { AuthUtils } from '../../../utils/authUtils';

interface HeaderDropdownProps {
  isVisible: boolean;
}

const HeaderDropdown: FC<HeaderDropdownProps> = ({ isVisible }) => {
  const navigate = useNavigate();

  const logout = async () => {
    await apiController({
      method: 'POST' as const,
      url: '/auth/google/logout',
    });

    AuthUtils.clearAuth();
    navigate('/');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed top-14 right-0 w-52 bg-${theme.myBlack} overflow-hidden`}
          initial={{
            height: 0,
            // y: -20,
          }}
          animate={{
            height: 'auto',
            // y: 0,
          }}
          exit={{
            height: 0,
            // y: -20,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <HeaderDropdownItem onClick={() => navigate('/mypage')}>
              <div>{headerTexts.myPage}</div>
            </HeaderDropdownItem>
            <HeaderDropdownItem onClick={() => logout()}>
              {headerTexts.logout}
            </HeaderDropdownItem>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HeaderDropdown;
