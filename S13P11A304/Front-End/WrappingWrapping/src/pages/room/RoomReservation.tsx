import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from '../../components/common/DatePicker';
import FilledButton from '../../components/common/FilledButton';
import LinedButton from '../../components/common/LinedButton';
import SelectTime from '../../components/common/SelectTime';
import Header from '../../components/layout/header/Header';
import { useNicknameStore } from '../../stores/useNicknameStore';
import { theme } from '../../styles/theme';
import apiController from '../../api/apiController';
import { jobs } from '../../types/interfaces/mainPage';
import WithdrawModal from '../../components/common/WithdrawModal';

const participantOptions = [1, 2, 3, 4, 5];

const RoomReservation: React.FC = () => {
  const [title, setTitle] = useState('');
  const [titleLength, setTitleLength] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('00:00');
  const [selectedJob, setSelectedJob] = useState('');
  const [maxParticipant, setMaxParticipant] = useState<number | null>(null);
  // const [existingReservations, setExistingReservations] = useState<any[]>([]);

  // WithdrawModal 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<'알림' | '확인'>('알림');
  const [modalMessage, setModalMessage] = useState('');
  const [modalHideCancel, setModalHideCancel] = useState(true); // true면 확인만
  const [modalOnConfirm, setModalOnConfirm] = useState<() => void>(
    () => () => setModalOpen(false),
  );

  const navigate = useNavigate();
  const { nickname } = useNicknameStore();

  const pad = (n: number) => String(n).padStart(2, '0');

  // 겹치는 시간대 범위
  const formatConflictRange = (isoStart: string) => {
    const start = new Date(isoStart);
    if (Number.isNaN(start.getTime())) {
      return isoStart.replace('T', ' ').slice(0, 16);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 정책 바뀌면 이 가산만 수정
    const y = start.getFullYear();
    const m = pad(start.getMonth() + 1);
    const d = pad(start.getDate());
    const sh = pad(start.getHours());
    const sm = pad(start.getMinutes());
    const eh = pad(end.getHours());
    const em = pad(end.getMinutes());
    return `${y}-${m}-${d} ${sh}:${sm}~${eh}:${em}`;
  };


  // alert 대체: 확인 1개
  const openAlert = (msg: string) => {
    setModalTitle('알림');
    setModalMessage(msg);
    setModalHideCancel(true);
    setModalOnConfirm(() => () => setModalOpen(false));
    setModalOpen(true);
  };

  // confirm 대체: 확인/취소
  const openConfirm = (msg: string, onConfirm: () => void) => {
    setModalTitle('확인');
    setModalMessage(msg);
    setModalHideCancel(false);
    setModalOnConfirm(() => () => {
      onConfirm();
      setModalOpen(false);
    });
    setModalOpen(true);
  };

  // 기존 예약 목록 가져오기
  // useEffect(() => {
  //   const fetchExistingReservations = async () => {
  //     try {
  //       const response = await apiController({
  //         method: 'GET' as const,
  //         url: '/reservations',
  //         params: { page: 0, size: 1000 }, // 충분히 큰 수로 모든 예약 가져오기
  //       });
  //
  //       if (response?.data?.result?.detailInfoList) {
  //         setExistingReservations(response.data.result.detailInfoList);
  //       }
  //     } catch (error) {
  //       console.error('기존 예약 목록을 가져오는데 실패했습니다:', error);
  //     }
  //   };
  //
  //   fetchExistingReservations();
  // }, []);

  // 시간 중복 체크 함수
  // const checkTimeConflict = (newScheduledTime: Date): boolean => {
  //   const newStartTime = new Date(newScheduledTime);
  //   const newEndTime = new Date(newScheduledTime.getTime() + 60 * 60 * 1000); // 1시간 후
  //
  //   return existingReservations.some((reservation) => {
  //     const existingStartTime = new Date(reservation.scheduledTime);
  //     const existingEndTime = new Date(
  //       existingStartTime.getTime() + 60 * 60 * 1000,
  //     ); // 1시간 후
  //
  //     // 시간이 겹치는지 체크
  //     return (
  //       (newStartTime >= existingStartTime && newStartTime < existingEndTime) ||
  //       (newEndTime > existingStartTime && newEndTime <= existingEndTime) ||
  //       (newStartTime <= existingStartTime && newEndTime >= existingEndTime)
  //     );
  //   });
  // };

  const handleCreate = async () => {
    if (title.length > 50) {
      openAlert('제목은 50자 이내로 입력해 주세요.');
      return;
    }
    if (!title) {
      openAlert('제목을 입력해 주세요.');
      return;
    }
    if (!selectedDate) {
      openAlert('날짜를 선택해 주세요.');
      return;
    }
    if (!selectedTime) {
      openAlert('시간을 선택해 주세요.');
      return;
    }
    if (!selectedJob) {
      openAlert('직무를 선택해 주세요.');
      return;
    }
    if (maxParticipant === null) {
      openAlert('최대 참여 인원을 선택해 주세요.');
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const combinedDate = new Date(selectedDate!);
    combinedDate.setHours(hours);
    combinedDate.setMinutes(minutes);
    combinedDate.setSeconds(0);
    combinedDate.setMilliseconds(0);

    // 이미 지난 시간 체크
    if (combinedDate <= new Date()) {
      openAlert('이미 지난 시간은 예약할 수 없습니다.');
      return;
    }

    // 한 시간 이후만 가능
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
    if (combinedDate < oneHourLater) {
      openAlert('예약은 현재 시각으로부터 한 시간 이후부터 가능합니다.');
      return;
    }

    // 기존 예약과 시간 중복 체크
    // if (checkTimeConflict(combinedDate)) {
    //   openAlert('이미 예약된 시간과 겹칩니다. 다른 시간을 선택해 주세요.');
    //   return;
    // }

    const selectedJobLabel =
      jobs.find((job) => job.value === selectedJob)?.label || selectedJob;

    // confirm 모달로 최종 확인
    openConfirm(
      `제목: ${title}\n날짜: ${selectedDate.toLocaleDateString()}\n시간: ${selectedTime}\n직무: ${selectedJobLabel}\n최대 참여 인원: ${maxParticipant}명\n\n이대로 예약하시겠습니까?`,
      async () => {
        // 확인을 누른 경우에만 실제 생성 진행
        const year = combinedDate.getFullYear();
        const month = pad(combinedDate.getMonth() + 1);
        const day = pad(combinedDate.getDate());
        const hour = pad(combinedDate.getHours());
        const minute = pad(combinedDate.getMinutes());
        const formattedKST = `${year}-${month}-${day}T${hour}:${minute}:00`;

        const requestData = {
          title,
          scheduledTime: formattedKST,
          job: selectedJob,
          mode: 'PT',
          maxParticipant,
        };

        try {
          const res = await apiController.post('/reservations', requestData);
          console.log('회의 생성 응답:', res);

          const payload = res?.data;
          if (payload?.isSuccess) {
            navigate('/mypage');
            return;
          }


          if (
            payload?.code === 'RESERVATION4002' &&
            typeof payload?.result === 'string'
          ) {
            const range = formatConflictRange(payload.result);
            openAlert(`${String(payload?.message ?? '회의 시간이 겹칩니다.')}\n ${range}`);
            return;
          }

          openAlert(payload?.message || '회의 생성에 실패했습니다.');
        } catch (err: any) {
          console.log('회의 생성 응답:', err);

          openAlert('회의 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
        }
      },
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setTitleLength(e.target.value.length);
  };

  const handleCancel = () => {
    navigate('/main');
  };

  return (
    <div className={`min-h-screen bg-${theme.myBlack} text-${theme.myWhite}`}>
      <Header nickname={nickname} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">회의 생성하기</h1>

        <div className="relative">
          <div
            className={`flex gap-3 items-center px-5 w-full p-3 rounded-3xl border border-${theme.primary} bg-${theme.myBlack} text-${theme.myWhite}
                        focus:outline-none focus:ring-2 focus:ring-${theme.primary} text-base sm:text-lg
                        ${titleLength > 50 ? 'bg-watermelon bg-opacity-20' : ''}`}
          >
            <input
              type="text"
              placeholder="제목을 입력하세요."
              value={title}
              onChange={handleChange}
              className="w-full bg-transparent focus:outline-none"
            />
            <div
              className={`text-sm text-gray-500 ${titleLength > 50 ? 'text-watermelon' : ''}`}
            >
              {titleLength}/50
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 justify-between items-start">
          {/* 왼쪽: 달력 */}
          <div className="flex justify-center">
            <div className="w-[400px]">
              <DatePicker onSelect={setSelectedDate} />
            </div>
          </div>

          {/* 오른쪽 */}
          <div className="w-[400px] h-[390px] flex flex-col items-center justify-between mx-auto">
            <SelectTime initialTime={selectedTime} onSelect={setSelectedTime} />

            {/* 직무 */}
            <div className="relative w-[400px]">
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className={`pl-5 pr-10 w-full py-3 rounded-3xl border border-${theme.primary} bg-${theme.myBlack} text-${theme.myWhite}
                            focus:outline-none focus:ring-2 focus:ring-${theme.primary} text-base appearance-none`}
              >
                <option value="" disabled>
                  직무 선택
                </option>
                {jobs.map((job) => (
                  <option key={job.value} value={job.value}>
                    {job.label}
                  </option>
                ))}
              </select>
              <span
                className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-${theme.primary}`}
              >
                ▼
              </span>
            </div>

            {/* 인원 */}
            <div className="relative w-[400px]">
              <select
                value={maxParticipant ?? ''}
                onChange={(e) => setMaxParticipant(Number(e.target.value))}
                className={`pl-5 pr-10 w-full py-3 rounded-3xl border border-${theme.primary} bg-${theme.myBlack} text-${theme.myWhite}
                            focus:outline-none focus:ring-2 focus:ring-${theme.primary} text-base appearance-none`}
              >
                <option value="" disabled>
                  최대 참여 인원
                </option>
                {participantOptions.map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <span
                className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-${theme.primary}`}
              >
                ▼
              </span>
            </div>

            {/* 버튼 */}
            <div className="w-[400px] flex flex-row sm:flex-row justify-between gap-3">
              <LinedButton
                label="취소"
                onClick={handleCancel}
                size="w-[190px] pl-12 pr-12 pt-2 pb-2"
              />
              <FilledButton
                label="만들기"
                onClick={handleCreate}
                size="w-[190px] pl-12 pr-12 pt-2 pb-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* WithdrawModal: alert/confirm 공용 */}
      <WithdrawModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={modalOnConfirm}
        title={modalTitle}
        message={modalMessage}
        confirmText="확인"
        cancelText="취소"
        hideCancel={modalHideCancel}
      />
    </div>
  );
};

export default RoomReservation;
