import React from 'react';
import {getCanChi, toLunarDate} from '../../../../common/src/LunarUtil';
import {getTimeZone} from '../../../../common/src/MiscUtil';
import clsx from 'clsx';
import Tooltip from '/@/components/Tooltip';
import fullMoonImage from '../../../assets/full-moon.png';
import type {CalendarEvent} from '../../../../common/src/EventData';

interface LunarTileContentProps {
  date: Date;
  events?: CalendarEvent[];
}

const LunarTileContent: React.FC<LunarTileContentProps> = ({date, events = []}) => {
  const lunar = toLunarDate(date, getTimeZone());

  const lunarDisplay = `${lunar.lunarDay}/${lunar.lunarMonth}${lunar.isLeapMonth ? '*' : ''}`;
  const isFirstDay = lunar.lunarDay === 1;
  const isMiddleDay = lunar.lunarDay === 15;
  const isFirstOrMiddleDay = isFirstDay || isMiddleDay;
  const isNewYear = lunar.lunarDay === 1 && lunar.lunarMonth === 1;
  const fullMoonSize = 16;
  const canChi = getCanChi(lunar.lunarYear);

  const dayEvents = events.filter(e => {
    if (e.type === 'solar') {
      return e.day === date.getDate() && e.month === date.getMonth() + 1;
    } else {
      return e.day === lunar.lunarDay && e.month === lunar.lunarMonth;
    }
  });

  const hasEvent = dayEvents.length > 0;
  const hasImportantEvent = dayEvents.some(e => e.isImportant);
  const eventNames = dayEvents.map(e => e.title).join(', ');
  const tooltipContent = eventNames ? `${canChi} • ${eventNames}` : canChi;

  return (
    <Tooltip tip={tooltipContent} position="tl">
      <div className="flex flex-col items-center">
        {
          isMiddleDay ?
            <div
              className="relative w-full flex justify-center"
            >
              <img
                className="relative top-0.5"
                width={fullMoonSize}
                height={fullMoonSize}
                src={fullMoonImage} alt="full moon" />
            </div>
            :
            <div
              className={clsx('mt-0.5 text-[10px] leading-none transition-colors duration-200', {
                'text-gray-500 dark:text-gray-400': !isFirstOrMiddleDay && !hasImportantEvent,
                'text-red-600 dark:text-red-400 font-semibold': isFirstOrMiddleDay || hasImportantEvent,
                'scale-105 animate-pulse': isNewYear,
              })}
            >
              {lunarDisplay}
            </div>
        }
        {hasEvent && (
          <div className="mt-1 flex gap-1">
            <div className={clsx('w-1 h-1 rounded-full', {
              'bg-red-500 shadow-[0_0_2px_rgba(239,68,68,0.6)]': hasImportantEvent,
              'bg-blue-400 dark:bg-blue-300': !hasImportantEvent,
            })} />
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default LunarTileContent;
