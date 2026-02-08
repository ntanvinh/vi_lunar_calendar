import React, {PropsWithChildren} from 'react';
import clsx from 'clsx';
import Tooltip, {TooltipProps} from '/@/components/Tooltip';

interface AppButtonProps extends TooltipProps {
  type?: 'primary' | 'text';
  onClick?: () => void;
}

const AppButton: React.FC<PropsWithChildren<AppButtonProps>> = (props) => {
  const {onClick, children, type = 'primary', tip, position} = props;

  return (
    <button
      className={clsx('rounded-md outline-none transition-all duration-200 text-[13px] font-medium', {
        // Primary (Standard Push Button)
        'px-3 py-1 border shadow-sm active:scale-95': type === 'primary',
        'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100': type === 'primary', // Light
        'dark:bg-[#2c2c2e] dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10 dark:active:bg-white/5': type === 'primary', // Dark

        // Text (Icon Button)
        'p-1.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10 active:scale-95': type === 'text',
        'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200': type === 'text',
      })}
      onClick={onClick}
      tabIndex={-1}
    >
      {
        tip ?
          <Tooltip tip={tip} position={position}>
            {children}
          </Tooltip>
          :
          children
      }
    </button>
  );
};

export default AppButton;
