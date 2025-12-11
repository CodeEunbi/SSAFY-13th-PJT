import React, { useState } from 'react';
import ExportIcon from '../../../assets/icons/export_icon.svg?react';
import { useWorkspace } from '../WorkSpace';
import { exportErdToSql, copySqlToClipboard, type SqlDialect } from '../../../apis/exportApi';

interface ExportProps {
  onClick?: () => void;
  isActive?: boolean;
}

const Export: React.FC<ExportProps> = ({ onClick, isActive }) => {
  const { projectKey } = useWorkspace();
  const [showModal, setShowModal] = useState(false);
  const [selectedDialect, setSelectedDialect] = useState<SqlDialect>('POSTGRESQL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowModal(true);
    }
  };

  const handleExport = async () => {
    console.log('handleExport 호출됨, projectKey:', projectKey);

    if (!projectKey) {
      setError('프로젝트 키가 없습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('API 호출 시작:', { projectKey, selectedDialect });
      const sql = await exportErdToSql(projectKey, selectedDialect);
      console.log('API 응답:', sql);
      await copySqlToClipboard(sql);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowModal(false);
      }, 1500);
    } catch (err) {
      console.error('Export 실패:', err);
      setError('SQL Export에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(null);
  };

  const buttonClasses = `w-8 h-8 flex items-center justify-center mb-2 rounded transition-colors hover:bg-ai-chat ${
    isActive ? 'bg-ai-chat' : 'bg-transparent'
  }`;

  return (
    <>
      <button
        onClick={handleClick}
        className={buttonClasses}
        aria-label="익스포트"
      >
        <ExportIcon className="w-5 h-5 text-my-black" />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">SQL Export</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SQL Dialect 선택
              </label>
              <select
                value={selectedDialect}
                onChange={(e) => setSelectedDialect(e.target.value as SqlDialect)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="POSTGRESQL">PostgreSQL</option>
                <option value="MYSQL">MySQL</option>
              </select>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                onClick={handleExport}
                disabled={isLoading || copied}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {copied ? '복사 완료!' : isLoading ? '복사 중...' : '복사하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Export;
