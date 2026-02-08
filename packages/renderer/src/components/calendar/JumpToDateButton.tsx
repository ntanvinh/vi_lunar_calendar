import React, {useEffect, useRef, useState} from 'react';
import {BiCalendar} from '@react-icons/all-files/bi/BiCalendar';
import AppButton from '/@/components/button/AppButton';
import clsx from 'clsx';

import {LunarDate, parseLunarDate} from '../../../../common/src/LunarUtil';

interface JumpToDateButtonProps {
  onJump?: (date: LunarDate) => void;
}

const JumpToDateButton: React.FC<JumpToDateButtonProps> = ({onJump}) => {
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [error, setError] = useState<string>();
  const jumpDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDialogVisible) {
      jumpDateRef.current?.focus();
    }
  }, [isDialogVisible]);
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log(jumpDateRef.current?.value);
    const jumpDateStr = jumpDateRef.current?.value;
    if (!jumpDateStr) {
      setError('chưa nhập ngày');
      return;
    }
    const lunarDate = parseLunarDate(jumpDateStr);
    if (!lunarDate) {
      setError('sai định dạng ngày');
      return;
    }
    console.log('jump to: ', lunarDate);
    onJump?.(lunarDate);
    e.currentTarget.reset();
  }

  return (
    <div className="relative inline-block text-left">
      <AppButton
        onClick={() => setIsDialogVisible(visible => !visible)}
        type="text"
        tip='Tới ngày âm lịch'
        position="left"
      >
        <BiCalendar size={18} />
      </AppButton>
      <div
        className={clsx('absolute right-0 top-full mt-2 z-50 origin-top-right transition-all duration-200', {
          'opacity-0 scale-95 pointer-events-none': !isDialogVisible,
          'opacity-100 scale-100 pointer-events-auto': isDialogVisible,
        })}
      >
        <div className="bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-xl rounded-xl shadow-xl border border-black/5 dark:border-white/10 p-3 min-w-[220px]">
          <form onSubmit={e => handleSubmit(e)} className="flex flex-col gap-2">
            <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 ml-1 uppercase tracking-wide">
              Đến ngày âm lịch
            </label>
            <input
              className={clsx(
                'w-full text-[13px] px-3 py-1.5 rounded-md outline-none transition-all',
                'bg-white dark:bg-[#2C2C2C]',
                'text-gray-900 dark:text-white',
                'border shadow-sm placeholder-gray-400 dark:placeholder-gray-500',
                {
                  'border-gray-300 dark:border-gray-600 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20': !error,
                  'border-[#FF3B30] focus:border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/20': !!error,
                }
              )}
              placeholder="vd: 1/12/2024"
              ref={jumpDateRef}
              type="text"
              autoFocus
              onBlur={() => {
                // Small delay to allow clicking logic if needed, but keeping it simple for now
                setIsDialogVisible(false);
              }}
              onChange={() => setError(undefined)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsDialogVisible(false);
                }
              }}
              name="jumpDateStr"
            />
            {
              error ?
                <span
                  className={clsx('text-[#FF3B30] text-[11px] px-1 font-medium flex items-center gap-1')}
                >
                  {error}
                </span>
                : null
            }
          </form>
        </div>
      </div>
    </div>
  );
};

export default JumpToDateButton;
