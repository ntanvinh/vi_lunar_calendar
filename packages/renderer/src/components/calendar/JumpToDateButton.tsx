import React, {useEffect, useRef, useState} from 'react';
import {BiCalendar} from '@react-icons/all-files/bi/BiCalendar';
import AppButton from '/@/components/button/AppButton';
import clsx from 'clsx';

import {LunarDate, parseLunarDate, toSolarDate} from '../../../../common/src/LunarUtil';
import {getTimeZone} from '../../../../common/src/MiscUtil';

interface JumpToDateButtonProps {
  onJump?: (date: Date) => void;
}

const JumpToDateButton: React.FC<JumpToDateButtonProps> = ({onJump}) => {
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [mode, setMode] = useState<'solar' | 'lunar'>('lunar');
  const [error, setError] = useState<string>();
  const jumpDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDialogVisible) {
      jumpDateRef.current?.focus();
    }
  }, [isDialogVisible]);

  function parseSolarDate(str: string): Date | null {
    const parts = str.split('/');
    if (parts.length < 2 || parts.length > 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    let y = new Date().getFullYear();
    if (parts.length === 3) {
      y = parseInt(parts[2], 10);
    }

    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    
    const date = new Date(y, m - 1, d);
    // Basic validation
    if (date.getDate() !== d || date.getMonth() !== m - 1 || date.getFullYear() !== y) {
        return null;
    }
    return date;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const jumpDateStr = jumpDateRef.current?.value;
    if (!jumpDateStr) {
      setError('chưa nhập ngày');
      return;
    }

    let targetDate: Date | null = null;

    if (mode === 'lunar') {
        const lunarDate = parseLunarDate(jumpDateStr);
        if (!lunarDate) {
            setError('sai định dạng ngày (d/m/y)');
            return;
        }
        targetDate = toSolarDate(lunarDate, getTimeZone());
    } else {
        targetDate = parseSolarDate(jumpDateStr);
        if (!targetDate) {
            setError('sai định dạng ngày (d/m/y)');
            return;
        }
    }

    if (targetDate) {
        onJump?.(targetDate);
        setIsDialogVisible(false);
        setError(undefined);
        if (jumpDateRef.current) jumpDateRef.current.value = '';
    }
  }

  return (
    <div className="relative inline-block text-left">
      <AppButton
        onClick={() => setIsDialogVisible(visible => !visible)}
        type="text"
        tip='Tới ngày'
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
          
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg mb-3">
            <button
              type="button"
              onClick={() => setMode('solar')}
              className={clsx('flex-1 text-[11px] py-1 rounded-md transition-all font-medium', {
                'bg-white dark:bg-[#2C2C2C] shadow-sm text-gray-900 dark:text-white': mode === 'solar',
                'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200': mode !== 'solar',
              })}
            >
              Dương lịch
            </button>
            <button
              type="button"
              onClick={() => setMode('lunar')}
              className={clsx('flex-1 text-[11px] py-1 rounded-md transition-all font-medium', {
                'bg-white dark:bg-[#2C2C2C] shadow-sm text-gray-900 dark:text-white': mode === 'lunar',
                'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200': mode !== 'lunar',
              })}
            >
              Âm lịch
            </button>
          </div>

          <form onSubmit={e => handleSubmit(e)} className="flex flex-col gap-2">
            <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 ml-1 uppercase tracking-wide">
              {mode === 'lunar' ? 'Đến ngày âm lịch' : 'Đến ngày dương lịch'}
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
                 // Keep visible to allow interaction with mode switch
                 // setIsDialogVisible(false);
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
