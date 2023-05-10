import Calendar from 'react-calendar';
import React from 'react';
import './AppCalendar.scss';

interface AppCalendarProps {
}

const AppCalendar: React.FC<AppCalendarProps> = () => {


  return (
    <Calendar
      locale="vi"
      showWeekNumbers
    />
  );
};

export default AppCalendar;
