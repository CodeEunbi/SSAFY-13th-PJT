// NicknameBox.tsx
import { useState, useEffect, useRef } from 'react';
import { PencilSquareIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import apiController from '../../api/apiController';

interface NicknameBoxProps {
  nickname: string;
  setNickname: (nickname: string) => void;
  email: string;
  onWithdraw: () => void;
}

export default function NicknameBox({
  nickname,
  setNickname,
  email,
  onWithdraw,
}: NicknameBoxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState(nickname);
  const [isSaving, setIsSaving] = useState(false);

  // 메시지 한 줄 + 상태
  const [helperMsg, setHelperMsg] =
    useState('닉네임은 공백 없이 입력해주세요.');
  const [isError, setIsError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNewNickname(nickname);
  }, [nickname]);

  const saveNickname = async (value: string) => {
    return apiController({
      method: 'PATCH' as const,
      url: '/users',
      data: { nickname: value.trim() },
    });
  };

  const handleSave = async () => {
    const value = newNickname.trim();

    if (!value || value === nickname) {
      setIsEditing(false);
      setIsError(false);
      setHelperMsg('닉네임은 공백 없이 입력해주세요.');
      return;
    }

    try {
      setIsSaving(true);
      setIsError(false);
      setHelperMsg('저장 중...');

      const res = await saveNickname(value);
      const result = res?.data?.result ?? res?.data;
      const saved = result?.nickname ?? value;

      setNickname(saved);
      setIsEditing(false);
      setIsError(false);
      setHelperMsg('닉네임은 공백 없이 입력해주세요.');
    } catch (err: any) {
      const code = err?.data?.code || err?.response?.data?.code;
      const status = err?.status || err?.response?.status;

      if (code === 'MEMBER4003' || status === 409) {
        setIsError(true);
        setHelperMsg('중복된 닉네임입니다.');
      } else if (status === 401) {
        setIsError(true);
        setHelperMsg('로그인이 만료되었습니다. 다시 로그인해주세요.');
      } else {
        setIsError(true);
        setHelperMsg('닉네임 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="bg-black bg-opacity-15 rounded-xl p-6 flex justify-between items-center mb-10 min-h-[100px]">
      <div className="flex flex-col gap-1 justify-center">
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <label className="text-watermelon font-semibold">닉네임</label>
              <input
                ref={inputRef}
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    await handleSave();
                  }
                }}
                disabled={isSaving}
                className={`border rounded-full px-4 py-1 text-center bg-transparent text-my-white
                  ${
                    isError
                      ? 'border-watermelon focus:border-watermelon focus:ring-watermelon'
                      : 'border-my-white focus:border-my-white focus:ring-my-white'
                  }
                  focus:ring-1 focus:outline-none`}
                aria-invalid={isError}
                aria-describedby="nickname-help"
              />
            </div>

            {/* 메시지 한 줄 */}
            <div
              id="nickname-help"
              className={`ml-[88px] mt-1 text-sm ${isError ? 'text-watermelon' : 'text-my-white/70'}`}
              aria-live="polite"
            >
              {helperMsg}
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold">
              <span className="text-watermelon">{nickname}</span>
              <span className="text-my-white">님의 페이지</span>
            </h1>
            <p className="text-my-white text-sm">{email}</p>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* 탈퇴하기 버튼 */}
        <button
          onClick={onWithdraw}
          className="text-my-white underline text-sm hover:text-watermelon transition-colors"
        >
          탈퇴하기
        </button>

        {/* 닉네임 편집/저장 버튼 */}
        <button
          onClick={isEditing ? handleSave : handleEdit}
          className="text-my-white disabled:opacity-60"
          disabled={isSaving}
          aria-label={isEditing ? '닉네임 저장' : '닉네임 편집'}
        >
          {isEditing ? (
            <CheckCircleIcon className="w-6 h-6 text-white hover:text-watermelon transition-colors" />
          ) : (
            <PencilSquareIcon className="w-6 h-6 text-white hover:text-watermelon transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
}
