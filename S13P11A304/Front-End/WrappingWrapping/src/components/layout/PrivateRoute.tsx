// src\components\layout\PrivateRoute.tsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthUtils } from '../../utils/authUtils';
// import { AuthContext } from '../../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const location = useLocation();
  // const token = AuthUtils.getAccessToken();

  
  return AuthUtils.isLoggedIn() ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  // if (!token) {
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }

  // return (
  //   <AuthContext.Provider value={{ token }}>{children}</AuthContext.Provider>
  );
};

export default PrivateRoute;
