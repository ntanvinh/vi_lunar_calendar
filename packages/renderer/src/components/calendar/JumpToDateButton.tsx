import React, {useEffect, useRef, useState} from 'react';
import {MdDateRange} from '@react-icons/all-files/md/MdDateRange';
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
    <>
      <AppButton
        onClick={() => setIsDialogVisible(visible => !visible)}
        type="text"
        tip='Tới ngày âm lịch'
        position="left"
      >
        <MdDateRange size={20} />
      </AppButton>
      <div
        className={clsx('absolute transition top-8 right-2.5 bg-black/20 rounded-md', {
          'scale-0': !isDialogVisible,
          'scale-100': isDialogVisible,
        })}
      >
        <form onSubmit={e => handleSubmit(e)}>
          <input
            ref={jumpDateRef}
            type="text"
            autoFocus
            onBlur={() => setIsDialogVisible(false)}
            onChange={() => setError(undefined)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsDialogVisible(false);
              }
            }}
            name="jumpDateStr"
            className={clsx('text-sm px-2 py-1 text-gray-800 outline-none border-2 rounded-md', {
              'border-blue-500 focus:border-blue-600': !error,
              'border-red-500 focus:border-red-600': !!error,
            })}
            placeholder="ví dụ 1/12/2022"
          />
          {
            error ?
              <span
                className={clsx('text-red-600 text-xs px-1 py-0.5 rounded-sm')}
              >
            {error}
          </span>
              : null
          }
        </form>
      </div>
    </>
  );
};

export default JumpToDateButton;
