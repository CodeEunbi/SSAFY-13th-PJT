import { useState } from 'react';
import Header from '../../components/layout/header/Header';
import ReportModal from './ReportModal';
import { useNicknameStore } from '../../stores/useNicknameStore';

export default function ReportPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { nickname } = useNicknameStore();

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // 모달이 닫힐 때 이전 페이지로 이동하거나 다른 처리
    window.history.back();
  };

  return (
    <div className="bg-my-black min-h-screen">
      <Header nickname={nickname} />
      <ReportModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        nickname={nickname}
      />
    </div>
  );
}
