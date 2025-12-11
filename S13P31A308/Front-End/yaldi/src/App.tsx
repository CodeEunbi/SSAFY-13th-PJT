import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Login from './pages/login/Login';
import SignUp from './pages/login/SignUp';
import LandingPage from './pages/landing/LandingPage';
import MyPage from './pages/myPage/MyPage';
import TeamPage from './pages/team/TeamPage';
import WorkSpacePage from './pages/workspace/WorkSpacePage';
import WorkspaceViewerPage from './pages/workspace/WorkspaceViewerPage';
import MainHeader from './components/common/MainHeader';
import ErdHeader from './components/common/ErdHeader';
import PrivateRoute from './components/common/PrivateRoute';
import DataModelDetailPage from './pages/dataModel/DataModelDetailPage';
import DataModelListPage from './pages/dataModel/DataModelListPage';
import VersionListPage from './pages/version/VersionListPage';
import VersionDetailPage from './pages/version/VersionDetailPage';
import SearchRestultsPage from './pages/search/SearchPage';
import { LoginRedirect } from './pages/login/LoginCallbackPage';
import NotFoundPage from './pages/NotFoundPage';
import AlertPage from './pages/notification/NotificationListPage';
import PublicVersionListPage from './pages/search/PulblicVersionListPage';
import PublicVersionViewerPage from './pages/search/PublicVersionViewerPage';
import useNotificationStream from './hooks/useSSENotification';

// 💡 최상위 라우팅 로직을 포함하는 메인 컴포넌트
const RootAppContent: React.FC = () => {
  // 알림 관련 SSE 연결.
  useNotificationStream();

  useEffect(() => {
    const onDragStart = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('dragstart', onDragStart);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragstart', onDragStart);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  // 💡 메인 헤더 레이아웃
  const LayoutWithMainHeader = () => {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <div>
          <MainHeader />
        </div>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    );
  };

  // 💡 ERD 헤더 레이아웃
  const LayoutWithErdHeader = () => {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <ErdHeader />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    );
  };

  return (
    // 2. createBrowserRouter 대신 <Routes>를 사용합니다.
    <Routes>
      {/* 공개 경로 (로그인 불필요) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/viewer/:viewerLinkKey" element={<WorkspaceViewerPage />} />
      <Route path="/oauth2/redirect" element={<LoginRedirect />} />

      {/* 메인헤더 + 랜딩페이지 (공개) */}
      <Route element={<LayoutWithMainHeader />}>
        <Route index element={<LandingPage />} />
      </Route>

      {/* 보호된 경로 (로그인 필요) */}
      <Route element={<PrivateRoute />}>
        {/* MainHeader를 사용하는 경로 그룹 */}
        <Route element={<LayoutWithMainHeader />}>
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/teampage/:teamKey" element={<TeamPage />} />
          <Route path="/search" element={<SearchRestultsPage />} />
          <Route
            path="/search/:projectKey/:projectName"
            element={<PublicVersionListPage />}
          />
          <Route
            path="/search/:projectKey/:projectName/:versionKey"
            element={<PublicVersionViewerPage />}
          />
          <Route path="/notification" element={<AlertPage />} />
        </Route>

        {/* ErdHeader를 사용하는 특수 경로 그룹 */}
        <Route element={<LayoutWithErdHeader />}>
          <Route
            path="/project/:projectKey/data-model"
            element={<DataModelListPage />}
          />
          <Route
            path="/project/:projectKey/data-model/:dataModelKey"
            element={<DataModelDetailPage />}
          />
          <Route
            path="/project/:projectKey/workspace"
            element={<WorkSpacePage mode="edit" />}
          />
          <Route
            path="/project/:projectKey/version"
            element={<VersionListPage />}
          />
          <Route
            path="/project/:projectKey/version/:versionKey"
            element={<VersionDetailPage />}
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

// 3. 최상위 App 컴포넌트는 BrowserRouter만 제공합니다.
const App: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<div>Loading...</div>}>
      <RootAppContent />
    </Suspense>
  </BrowserRouter>
);

export default App;
