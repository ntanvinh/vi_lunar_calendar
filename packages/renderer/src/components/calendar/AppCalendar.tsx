import Calendar from 'react-calendar';
import React, {useEffect, useState} from 'react';
import LunarTileContent from '/@/components/calendar/LunarTileContent';
import styled from 'styled-components';
import AppButton from '/@/components/button/AppButton';
import {getCanChi, getFirstDayOfLunarYear, toSolarDate} from '../../../../common/src/LunarUtil';
import {getDateWithoutTime, getNextDay, getTimeZone, getToday} from '../../../../common/src/MiscUtil';
import {BiChevronRightCircle} from '@react-icons/all-files/bi/BiChevronRightCircle';
import {BiChevronLeftCircle} from '@react-icons/all-files/bi/BiChevronLeftCircle';
import {Value} from 'react-calendar/dist/esm/shared/types';
import JumpToDateButton from '/@/components/calendar/JumpToDateButton';

interface AppCalendarProps {
}

const AppCalendar: React.FC<AppCalendarProps> = () => {
  const [activeStartDate, setActiveStartDate] = useState<Date>(getToday());
  const [calendarValue, setCalendarValue] = useState<Value>(getToday());
  const [currentDay, setCurrentDay] = useState<Date>(getToday());

  useEffect(() => {
    const timerId = setInterval(() => {
      const nextDay = getNextDay(currentDay);

      // if change date then refresh component
      const now = new Date();
      if (now.getTime() >= nextDay.getTime()) {
        setCurrentDay(nextDay);

      } else if (now.getTime() <= currentDay.getTime()) {
        setCurrentDay(getDateWithoutTime(now));
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
    <div>
      <div
        className="w-full relative"
      >

        <div
          className="mt-4 mb-2 w-full flex justify-center space-x-10"
        >
          <AppButton
            onClick={() => {
              handleJumpToLunarYear(-1);
            }}
            type="text"
            tip={`Năm trước ${getCanChi(getFirstDayOfLunarYear(activeStartDate, -1).getFullYear())}`}
            position="bottom"
          >
            <BiChevronLeftCircle size={24} />
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
            <BiChevronRightCircle size={24} />
          </AppButton>
        </div>
        <span
          className="absolute top-1.5 right-3"
        >
          <JumpToDateButton onJump={(lunarDate) => {
            const date = toSolarDate(lunarDate, getTimeZone());
            setActiveStartDate(date);
            setCalendarValue(date);
          }} />
        </span>
      </div>

      <StyledCalendar
        value={calendarValue}
        onChange={(value) => {
          value && setCalendarValue(value);
        }}
        locale="vi"
        showWeekNumbers
        activeStartDate={activeStartDate}
        onActiveStartDateChange={({activeStartDate}) => activeStartDate && setActiveStartDate(activeStartDate)}
        tileContent={({date, view}) => {
          if (view !== 'month') {
            return;
          }
          return (
            <LunarTileContent date={date} />
          );
        }}
      />
    </div>
  );
};

export default AppCalendar;

const StyledCalendar = styled(Calendar).attrs({
  $todayBgColor: '#eab308',
  $todayBgColor_Hover: '#facc15',
  $weekendText: '#d10000',
  $activeBgColor: '#1d4ed8',
  $activeBgColor_Hover: '#2563eb',
})`
  button:focus {
    outline: none;
  }

  .react-calendar {
    width: 350px;
    max-width: 100%;
    color: grey;
    border: 1px solid #a0a096;
    font-family: Arial, Helvetica, sans-serif;
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
  }

  .react-calendar__navigation button:disabled {
    background-color: #f0f0f0;
  }

  .react-calendar__navigation button:enabled:hover {
    background-color: ${props => props.$activeBgColor_Hover};
    color: white;
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
    border-radius: 6px;
    max-width: 100%;
    padding: 10px 6.6667px;
    background: none;
    text-align: center;
    line-height: 16px;
    overflow: visible !important;
  }

  .react-calendar__tile:disabled {
    background-color: #f0f0f0;
  }

  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background-color: ${props => props.$activeBgColor_Hover};
    color: white;
  }

  .react-calendar__tile--now {
    background-color: ${props => props.$todayBgColor};
    color: white;
    font-weight: bold;
  }

  .react-calendar__tile--now:enabled:hover,
  .react-calendar__tile--now:enabled:focus {
    background-color: ${props => props.$todayBgColor_Hover};
  }

  .react-calendar__tile--hasActive {
    background: #006edc;
  }

  .react-calendar__tile--hasActive:enabled:hover,
  .react-calendar__tile--hasActive:enabled:focus {
    background: ${props => props.$activeBgColor_Hover};
  }

  .react-calendar__tile--active {
    background: ${props => props.$activeBgColor};
    color: white;
  }

  .react-calendar__tile--active:enabled:hover,
  .react-calendar__tile--active:enabled:focus {
    background: ${props => props.$activeBgColor_Hover};
  }

  .react-calendar--selectRange .react-calendar__tile--hover {
    background-color: ${props => props.$activeBgColor_Hover};
  }
`;
