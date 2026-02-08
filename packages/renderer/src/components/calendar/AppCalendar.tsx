import Calendar from 'react-calendar';
import React, {useEffect, useState} from 'react';
import LunarTileContent from '/@/components/calendar/LunarTileContent';
import styled from 'styled-components';
import AppButton from '/@/components/button/AppButton';
import {getCanChi, getFirstDayOfLunarYear, toSolarDate} from '../../../../common/src/LunarUtil';
import {getNextDay, getTimeZone, getToday} from '../../../../common/src/MiscUtil';
import type {CalendarEvent} from '../../../../common/src/EventData';
import {BiChevronRight} from '@react-icons/all-files/bi/BiChevronRight';
import {BiChevronLeft} from '@react-icons/all-files/bi/BiChevronLeft';
import {Value} from 'react-calendar/dist/esm/shared/types';
import JumpToDateButton from '/@/components/calendar/JumpToDateButton';
import {twRgb} from '../../../../common/src/TailwindUtil';

interface AppCalendarProps {
}

const AppCalendar: React.FC<AppCalendarProps> = () => {
  const [activeStartDate, setActiveStartDate] = useState<Date>(getToday());
  const [calendarValue, setCalendarValue] = useState<Value>(getToday());
  const [currentDay, setCurrentDay] = useState<Date>(getToday());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      const api = (window as any).eventManager;
      if (api) {
        try {
          const data = await api.getEvents();
          setEvents(data);
        } catch (e) {
          console.error('Failed to load events in calendar', e);
        }
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      const nextDay = getNextDay(currentDay);

      // if change date then refresh component
      const now = new Date();
      if (now.getTime() >= nextDay.getTime()
        || now.getTime() <= currentDay.getTime()
      ) {
        setCurrentDay(now);
        setActiveStartDate(now);
        setCalendarValue(now);
      }
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [currentDay]);

  function handleJumpToday() {
    setActiveStartDate(new Date());
    setCalendarValue(new Date());
  }

  function handleJumpToLunarYear(yearOffset: number) {
    const firstDayOfLunarYear = getFirstDayOfLunarYear(activeStartDate, yearOffset);
    setActiveStartDate(firstDayOfLunarYear);
    setCalendarValue(firstDayOfLunarYear);
  }

  return (
    <div className="px-6 flex flex-col items-center h-screen">
      <div
        className="w-full mt-4 mb-2 grid grid-cols-[1fr_auto_1fr] items-center"
      >
        <div></div>
        <div
          className="flex justify-center space-x-10"
        >
          <AppButton
            onClick={() => {
              handleJumpToLunarYear(-1);
            }}
            type="text"
            tip={`Năm trước ${getCanChi(getFirstDayOfLunarYear(activeStartDate, -1).getFullYear())}`}
            position="bottom"
          >
            <BiChevronLeft size={24} />
          </AppButton>

          <AppButton
            onClick={handleJumpToday}
          >
            Hôm nay
          </AppButton>
          <AppButton
            onClick={() => {
              handleJumpToLunarYear(1);
            }}
            type="text"
            tip={`Năm tới ${getCanChi(getFirstDayOfLunarYear(activeStartDate, 1).getFullYear())}`}
            position="bottom"
          >
            <BiChevronRight size={24} />
          </AppButton>
        </div>
        <div className="flex justify-end pr-3 relative">
          <JumpToDateButton onJump={(lunarDate) => {
            const date = toSolarDate(lunarDate, getTimeZone());
            setActiveStartDate(date);
            setCalendarValue(date);
          }} />
        </div>
      </div>

      <div className="w-full">
        <StyledCalendar
          value={calendarValue}
          onChange={(value) => {
            value && setCalendarValue(value);
          }}
          locale="vi"
          calendarType="iso8601"
          activeStartDate={activeStartDate}
          onActiveStartDateChange={({activeStartDate}) => activeStartDate && setActiveStartDate(activeStartDate)}
          tileContent={({date, view}) => {
            if (view !== 'month') {
              return;
            }
            return (
              <LunarTileContent date={date} events={events} />
            );
          }}
        />
      </div>
    </div>
  );
};

export default AppCalendar;

const StyledCalendar = styled(Calendar).attrs({
  $todayBgColor: '#FF3B30', // macOS Red
  $todayBgColor_Hover: '#FF453A',
  $weekendText: '#FF3B30',
  $activeBgColor: '#007AFF', // macOS Blue
  $activeBgColor_Hover: '#0062CC',
})`
  button:focus {
    outline: none;
  }

  .react-calendar {
    width: 380px;
    max-width: 100%;
    color: grey;
    border: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.125em;
  }

  .react-calendar--doubleView {
    width: 700px;
  }

  .react-calendar--doubleView .react-calendar__viewContainer {
    display: flex;
    margin: -0.5em;
  }

  .react-calendar--doubleView .react-calendar__viewContainer > * {
    width: 50%;
    margin: 0.5em;
  }

  .react-calendar,
  .react-calendar *,
  .react-calendar *:before,
  .react-calendar *:after {
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
  }

  .react-calendar button {
    margin: 0;
    border: 0;
    outline: none;
  }

  .react-calendar button:enabled:hover {
    cursor: pointer;
  }

  .react-calendar__navigation {
    display: flex;
    height: 44px;
    margin-bottom: 1em;
  }

  .react-calendar__navigation button {
    min-width: 44px;
    background: none;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .react-calendar__navigation button:disabled {
    background-color: #f0f0f0;
    color: #bbb;
  }

  .react-calendar__navigation button:enabled:hover {
    background-color: rgba(229, 231, 235, 0.5);
    color: inherit;
  }

  :global(.dark) & .react-calendar__navigation button:enabled:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .react-calendar__navigation button:enabled:active {
    transform: scale(0.95);
  }

  .react-calendar__month-view__weekdays {
    text-align: center;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 0.75em;
    user-select: none;
  }

  .react-calendar__month-view__weekdays__weekday {
    padding: 0.5em;
  }

  .react-calendar__month-view__weekNumbers .react-calendar__tile {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
    font-weight: bold;
    user-select: none;
  }

  .react-calendar__month-view__days__day--weekend {
    color: ${props => props.$weekendText};
  }

  .react-calendar__month-view__days__day--neighboringMonth {
    color: #757575;
  }

  .react-calendar__year-view .react-calendar__tile,
  .react-calendar__decade-view .react-calendar__tile,
  .react-calendar__century-view .react-calendar__tile {
    padding: 2em 0.5em;
  }

  .react-calendar__tile {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    border-radius: 12px;
    max-width: 100%;
    padding: 6px 4px 16px 4px;
    background: none;
    text-align: center;
    line-height: 16px;
    overflow: visible !important;
    border: 3px solid transparent;
    background-clip: padding-box;
  }

  .react-calendar__tile > abbr {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px;
    display: block;
  }

  .react-calendar__tile:disabled {
    background-color: transparent;
    opacity: 0.5;
  }

  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background-color: rgba(0, 0, 0, 0.05);
    color: inherit;
  }
  
  :global(.dark) .react-calendar__tile:enabled:hover,
  :global(.dark) .react-calendar__tile:enabled:focus {
    background-color: rgba(255, 255, 255, 0.1);
    color: inherit;
  }

  .react-calendar__tile--now {
    background-color: ${props => props.$todayBgColor};
    color: white;
    font-weight: 500;
    border: 3px solid transparent;
    background-clip: padding-box;
  }

  .react-calendar__tile--now:enabled:hover,
  .react-calendar__tile--now:enabled:focus {
    background-color: ${props => props.$todayBgColor_Hover};
  }

  .react-calendar__tile--hasActive {
    background: ${props => props.$activeBgColor};
    color: white;
    border: 3px solid transparent;
    background-clip: padding-box;
  }

  .react-calendar__tile--hasActive:enabled:hover,
  .react-calendar__tile--hasActive:enabled:focus {
    background: ${props => props.$activeBgColor_Hover};
  }

  .react-calendar__tile--active {
    background: ${props => props.$activeBgColor};
    color: white;
    border: 3px solid transparent;
    background-clip: padding-box;
  }

  .react-calendar__tile--active:enabled:hover,
  .react-calendar__tile--active:enabled:focus {
    background: ${props => props.$activeBgColor_Hover};
  }

  /* macOS-style contrast adjustments */
  .react-calendar__tile--now .lunar-date-text,
  .react-calendar__tile--active .lunar-date-text,
  .react-calendar__tile--hasActive .lunar-date-text {
    color: rgba(255, 255, 255, 0.9) !important;
  }

  .react-calendar__tile--now > abbr,
  .react-calendar__tile--active > abbr,
  .react-calendar__tile--hasActive > abbr {
    color: #ffffff !important;
  }

  .react-calendar--selectRange .react-calendar__tile--hover {
    background-color: ${props => props.$activeBgColor_Hover};
  }
`;
