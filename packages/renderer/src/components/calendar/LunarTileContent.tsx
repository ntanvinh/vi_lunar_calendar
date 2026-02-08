import React from 'react';
import {getCanChi, toLunarDate} from '../../../../common/src/LunarUtil';
import {getTimeZone} from '../../../../common/src/MiscUtil';
import clsx from 'clsx';
import Tooltip from '/@/components/Tooltip';
import fullMoonImage from '../../../assets/full-moon.png';

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
  const canChi = getCanChi(lunar.lunarYear);
  return (
    <Tooltip tip={canChi} position="tl">
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
            className={clsx('mt-0.5 text-[10px] leading-none', {
              'text-gray-500 dark:text-gray-400': !isFirstOrMiddleDay,
              'text-red-600 dark:text-red-400 font-semibold': isFirstOrMiddleDay,
              'scale-105 animate-pulse': isNewYear,
            })}
          >
            {lunarDisplay}
          </div>
      }
    </Tooltip>
  );
};

export default LunarTileContent;
