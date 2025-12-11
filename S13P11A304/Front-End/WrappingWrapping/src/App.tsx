// App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

import LandingPage from './pages/landing/LandingPage';
import MainPage from './pages/main/MainPage';
import RoomReservation from './pages/room/RoomReservation';
import RoomMeeting from './pages/room/RoomMeeting';
import RoomWaiting from './pages/room/RoomWaiting';
import MyPage from './pages/mypage/MyPage';
import Login from './pages/login/Login';
import SignUp from './pages/login/SignUp';
import NotFound from './pages/NotFound';
import NavigationProvider from './contexts/NavigationProvider';
import AuthCallback from './pages/login/AuthCallback';
import PrivateRoute from './components/layout/PrivateRoute';

import { RoomProvider } from './contexts/RoomContext';

const App: React.FC = () => {
  useEffect(() => {
    const onDragStart = (e: DragEvent) => {
      e.preventDefault(); // 텍스트 드래그 시작 차단
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault(); // 드롭 차단
    };

    window.addEventListener('dragstart', onDragStart);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragstart', onDragStart);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  return (
    <OverlayScrollbarsComponent
      element="div"
      options={{
        scrollbars: {
          theme: 'os-theme-dark',
          autoHide: 'scroll',
        },
      }}
      defer
      style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}
    >
      <BrowserRouter>
        <NavigationProvider>
          <RoomProvider>
            <Routes>
              {/* 공개 페이지 (로그인 불필요) */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* 보호된 페이지: 접근 시 로그인 필요 */}
              <Route
                path="/main"
                element={
                  <PrivateRoute>
                    <MainPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/room/reservation"
                element={
                  <PrivateRoute>
                    <RoomReservation />
                  </PrivateRoute>
                }
              />
              <Route
                path="/meeting/:roomId"
                element={
                  <PrivateRoute>
                    <RoomMeeting />
                  </PrivateRoute>
                }
              />
              <Route
                path="/waiting/:roomId"
                element={
                  <PrivateRoute>
                    <RoomWaiting />
                  </PrivateRoute>
                }
              />
              <Route
                path="/mypage"
                element={
                  <PrivateRoute>
                    <MyPage />
                  </PrivateRoute>
                }
              />

              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RoomProvider>
        </NavigationProvider>
      </BrowserRouter>
    </OverlayScrollbarsComponent>
  );
};

export default App;
