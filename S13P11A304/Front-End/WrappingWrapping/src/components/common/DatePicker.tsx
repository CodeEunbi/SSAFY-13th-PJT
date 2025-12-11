import { useEffect, useState } from 'react';
import Calendar, { CalendarProps } from 'react-calendar';
import '../../styles/DatePicker.tw.css';
import { theme } from '../../styles/theme';
import { useFilterStore } from '../../stores/useFilterStore';

interface DatePickerProps {
  parent?: string;
  onSelect?: (date: Date | null) => void;
}

const DatePicker = ({ parent, onSelect }: DatePickerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [calendarKey, setCalendarKey] = useState(Date.now());

  useEffect(() => {
    if (selectedDate === null) {
      setCalendarKey(Date.now()); // 완전한 리마운트 트리거
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur(); // 포커스 제거
      }
    }
  }, [selectedDate]);

  // useEffect(() => {
  //   (window as any).filterStore = useFilterStore;
  //   console.log('FilterStore가 window.filterStore에 노출되었습니다.');
  //   console.log('사용법: window.filterStore.getState()');
  // }, []);

  useEffect(() => {
    if (parent && parent === 'filters') {
      if (selectedDate) {
        // 타임존 문제 해결: 로컬 시간 기준으로 날짜 포맷팅
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        useFilterStore.getState().setSelectedDate(formattedDate);
      } else {
        useFilterStore.getState().clearSelectedDate();
      }
    } else {
      if (onSelect) {
        if (selectedDate) {
          onSelect(selectedDate);
        } else {
          onSelect(null);
        }
      }
    }
  }, [selectedDate]);

  // CalendarProps의 onChange 타입 사용
  const handleFilterDateChange: CalendarProps['onChange'] = (value) => {
    if (value instanceof Date) {
      if (
        selectedDate &&
        value.toDateString() === selectedDate.toDateString()
      ) {
        setSelectedDate(null);
      } else {
        setSelectedDate(value);
      }
    } else {
      setSelectedDate(null);
    }
  };

  return (
    <div
      className={`border border-${theme.primary} flex flex-shrink-1 w-full rounded-2xl m-0 justify-center`}
    >
      <Calendar
        key={calendarKey}
        value={selectedDate ?? undefined}
        onChange={handleFilterDateChange}
        formatDay={(_, date) => date.getDate().toString()}
        prev2Label={null}
        next2Label={null}
        maxDetail="month"
        minDetail="month"
        calendarType="gregory"
        showFixedNumberOfWeeks={true}
        selectRange={false}
        minDate={new Date()} // 오늘 이후 선택
      />
    </div>
  );
};

export default DatePicker;
