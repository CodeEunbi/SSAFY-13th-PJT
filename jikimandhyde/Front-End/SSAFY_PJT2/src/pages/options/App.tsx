import React, { useState } from 'react';
import SideBar from '../../components/layouts/SideBar';
import SettingsPage from '../settings/SettingsPage';
import FilteringPage from '../filtering/FilteringPage';
import GuidePage from '../guide/GuidePage';

const OptionsApp: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState('일반');

  const renderPage = () => {
    switch (selectedMenu) {
      case '일반':
        return <SettingsPage />;
      case '필터링 설정':
        return <FilteringPage />;
      case '가이드':
        return <GuidePage />;
      default:
        return <SettingsPage />;
    }
  };

  return (
    <div className="h-screen">
      <SideBar selectedMenu={selectedMenu} onMenuClick={setSelectedMenu} />
      <div className="ml-80 h-screen overflow-y-auto p-12">{renderPage()}</div>
    </div>
  );
};

export default OptionsApp;
