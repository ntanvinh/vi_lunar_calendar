import React from 'react';
import {toLunarDate} from '../../../../common/src/LunarUtil';
import {getTimeZone} from '../../../../common/src/MiscUtil';
import clsx from 'clsx';

interface LunarTileContentProps {
  date: Date;
}

const LunarTileContent: React.FC<LunarTileContentProps> = ({date}) => {
  const lunar = toLunarDate(date, getTimeZone());

  const lunarDisplay = `${lunar.lunarDay}/${lunar.lunarMonth}${lunar.isLeapMonth ? '*' : ''}`;
  const isFirstDay = lunar.lunarDay === 1;
  const isMiddleDay = lunar.lunarDay === 15;
  const isFirstOrMiddleDay = isFirstDay || isMiddleDay;
  const isNewYear = lunar.lunarDay === 1 && lunar.lunarMonth === 1;
  const fullMoonSize = 16;
  return (
    <>
      {
        isMiddleDay ?
          <div
            className="relative w-full flex justify-center"
          >
            <img
              className='relative top-0.5'
              width={fullMoonSize}
              height={fullMoonSize}
              src="assets/full-moon.png" alt="full moon" />
          </div>
          :
          <div
            className={clsx('text-[12px] ', {
              'text-gray-700 dark:text-gray-300': !isFirstOrMiddleDay,
              'text-amber-700 dark:text-amber-300': isFirstOrMiddleDay,
              'font-bold': isFirstDay,
              'scale-105 animate-pulse': isNewYear,
            })}
          >
            {lunarDisplay}
          </div>
      }
    </>
  );
};

export default LunarTileContent;
