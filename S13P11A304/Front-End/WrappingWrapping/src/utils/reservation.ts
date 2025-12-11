export const reservationsdata = [
  {
    id: 1,
    date: new Date(Date.now() + 1 * 60 * 1000).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }),
    job: '마케팅',
    title: '면접 스터디: 마케팅 직군 실전',
    scheduledTime: new Date(Date.now() + 1 * 60 * 1000).toISOString(), // 현재 시간 + 1분
  },
  {
    id: 2,
    date: new Date(Date.now() + 12 * 60 * 1000).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }),
    job: 'IT',
    title: '코딩 테스트 준비 모임',
    scheduledTime: new Date(Date.now() + 12 * 60 * 1000).toISOString(), // 현재 시간 + 12분
  },
  {
    id: 3,
    date: new Date(Date.now() + 20 * 60 * 1000).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }),
    job: '금융',
    title: '금융 쪽으로 취업하실 분 모여라~',
    scheduledTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 현재 시간 + 20분
  },
];
