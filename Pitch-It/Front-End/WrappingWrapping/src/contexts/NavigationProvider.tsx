// components/layout/NavigationProvider.tsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import navigationService from '../utils/MyNavigation';

interface NavigationProviderProps {
  children: React.ReactNode;
}

const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    // 전역 네비게이션 서비스에 navigate 함수 등록
    navigationService.setNavigate(navigate);
  }, [navigate]);

  return <>{children}</>;
};

export default NavigationProvider;
