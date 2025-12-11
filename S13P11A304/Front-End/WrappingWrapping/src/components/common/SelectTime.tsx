import React, { useState, useEffect, useRef } from 'react';
import { theme } from '../../styles/theme';

interface SelectTimeProps {
  initialTime?: string;
  onSelect: (time: string) => void;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;
const PADDING = Math.floor(VISIBLE_ITEMS / 2);

const hours = Array.from({ length: 12 }, (_, i) =>
  (i + 1).toString().padStart(2, '0'),
);
const minutes = ['00', '30'];
const ampm = ['AM', 'PM'];

const SelectTime: React.FC<SelectTimeProps> = ({
  // initialTime = '12:00 AM',
  onSelect,
}) => {
  const [selectedHour, setSelectedHour] = useState('01');
  const [selectedMinute, setSelectedMinute] = useState('00');

  const [selectedAmPm, setSelectedAmPm] = useState('AM');

  const hourRef = useRef<HTMLDivElement>(
    null,
  ) as React.RefObject<HTMLDivElement>;
  const minuteRef = useRef<HTMLDivElement>(
    null,
  ) as React.RefObject<HTMLDivElement>;
  const ampmRef = useRef<HTMLDivElement>(
    null,
  ) as React.RefObject<HTMLDivElement>;

  const scrollTimeouts = useRef<Record<string, number>>({});
  const isWheelScrolling = useRef<{ [key: string]: boolean }>({});

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // const [time, period] = initialTime.split(' ');
      // const [h, m] = time.split(':');
      // setSelectedHour(h.padStart(2, '0'));
      // setSelectedMinute(m.padStart(2, '0'));
      // setSelectedAmPm(period);
      initialized.current = true;
    }
  }, []);

  const scrollToItem = (
    ref: React.RefObject<HTMLDivElement>,
    index: number,
  ) => {
    if (ref.current) {
      const scrollTop = (index - PADDING) * ITEM_HEIGHT;
      ref.current.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  };

  const getCenteredIndex = (scrollTop: number) => {
    return Math.round(scrollTop / ITEM_HEIGHT) + PADDING;
  };

  const handleScroll = (
    key: string,
    ref: React.RefObject<HTMLDivElement>,
    options: string[],
    setter: (val: string) => void,
  ) => {
    if (!ref.current || isWheelScrolling.current[key]) return;

    clearTimeout(scrollTimeouts.current[key]);
    scrollTimeouts.current[key] = setTimeout(() => {
      const scrollTop = ref.current!.scrollTop;
      const index = getCenteredIndex(scrollTop);
      const boundedIndex = Math.max(
        PADDING,
        Math.min(options.length + PADDING - 1, index),
      );
      const selectedIndex = boundedIndex - PADDING;
      setter(options[selectedIndex]);
      scrollToItem(ref, boundedIndex);
    }, 100);
  };

  const handleWheelScroll = (
    e: React.WheelEvent,
    key: string,
    items: string[],
    selected: string | undefined,
    setter: (val: string) => void,
    ref: React.RefObject<HTMLDivElement>,
  ) => {
    // e.preventDefault(); // 스크롤 필요한데 왜 막았나요? 에러나서 주석처리 했어요

    if (isWheelScrolling.current[key]) return;
    isWheelScrolling.current[key] = true;

    const currentIndex = selected ? items.indexOf(selected) : 0;
    const direction = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.max(
      0,
      Math.min(items.length - 1, currentIndex + direction),
    );

    if (newIndex !== currentIndex) {
      setter(items[newIndex]);
      scrollToItem(ref, newIndex + PADDING);
    }

    setTimeout(() => {
      isWheelScrolling.current[key] = false;
    }, 150);
  };

  useEffect(() => {
    scrollToItem(hourRef, hours.indexOf(selectedHour) + PADDING);
  }, [selectedHour]);

  useEffect(() => {
    if (selectedMinute !== undefined) {
      scrollToItem(minuteRef, minutes.indexOf(selectedMinute) + PADDING);
    }
  }, [selectedMinute]);

  useEffect(() => {
    scrollToItem(ampmRef, ampm.indexOf(selectedAmPm) + PADDING);
  }, [selectedAmPm]);

  useEffect(() => {
    if (selectedMinute === undefined) return;
    const h = parseInt(selectedHour, 10);
    const hour24 =
      selectedAmPm === 'PM' && h !== 12
        ? h + 12
        : selectedAmPm === 'AM' && h === 12
          ? 0
          : h;
    const timeStr = `${hour24.toString().padStart(2, '0')}:${selectedMinute}`;
    onSelect(timeStr);
  }, [selectedHour, selectedMinute, selectedAmPm]);

  const renderColumn = (
    key: string,
    items: string[],
    selected: string | undefined,
    setter: (val: string) => void,
    ref: React.RefObject<HTMLDivElement>,
  ) => (
    <div
      className="relative w-1/3 text-center overflow-hidden"
      style={{ height: `${ITEM_HEIGHT * VISIBLE_ITEMS}px` }}
    >
      {/* 중앙선 */}
      <div
        className={`absolute top-[40px] left-0 right-0 border-t border-${theme.primary} z-10`}
      />
      <div
        className={`absolute top-[80px] left-0 right-0 border-t border-${theme.primary} z-10`}
      />

      <div
        ref={ref}
        onScroll={() => handleScroll(key, ref, items, setter)}
        onWheel={(e) => handleWheelScroll(e, key, items, selected, setter, ref)}
        className="no-scrollbar"
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
        }}
      >
        {[...Array(PADDING)].map((_, i) => (
          <div key={`top-${i}`} style={{ height: ITEM_HEIGHT }} />
        ))}

        {items.map((item, index) => {
          const isSelected = selected === item;
          return (
            <div
              key={item}
              className={`h-[40px] flex items-center justify-center snap-center cursor-pointer ${
                isSelected
                  ? `text-${theme.myWhite} font-bold text-lg`
                  : `text-${theme.myLightGrey} text-base`
              }`}
              // style={{ scrollSnapAlign: 'center' }}
              onClick={() => {
                setter(item);
                scrollToItem(ref, index + PADDING);
              }}
            >
              {item}
            </div>
          );
        })}

        {[...Array(PADDING)].map((_, i) => (
          <div key={`bot-${i}`} style={{ height: ITEM_HEIGHT }} />
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={`flex items-center bg-${theme.myBlack} py-3 px-10 rounded-2xl border border-${theme.primary} w-[400px]`}
    >
      {renderColumn('hour', hours, selectedHour, setSelectedHour, hourRef)}
      <div
        className={`text-${theme.myWhite} font-bold text-xl w-5 text-center`}
      >
        :
      </div>
      {renderColumn(
        'minute',
        minutes,
        selectedMinute,
        setSelectedMinute,
        minuteRef,
      )}
      <div className="w-5" />
      {renderColumn('ampm', ampm, selectedAmPm, setSelectedAmPm, ampmRef)}
    </div>
  );
};

export default SelectTime;
