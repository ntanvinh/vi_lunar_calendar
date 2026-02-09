import React, {PropsWithChildren} from 'react';
import clsx from 'clsx';
import Tooltip, {TooltipProps} from '/@/components/Tooltip';

interface AppButtonProps extends TooltipProps {
  type?: 'primary' | 'text';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const AppButton: React.FC<PropsWithChildren<AppButtonProps>> = (props) => {
  const {onClick, children, type = 'primary', tip, position, className, disabled} = props;

  return (
    <button
      className={clsx('rounded-md outline-none transition-all duration-200 text-[13px] font-medium', {
        // Disabled state
        'opacity-50 cursor-not-allowed': disabled,
        
        // Primary (Standard Push Button)
        'px-3 py-1 border shadow-sm active:scale-95': type === 'primary' && !disabled,
        'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100': type === 'primary' && !disabled, // Light
        'dark:bg-[#2c2c2e] dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10 dark:active:bg-white/5': type === 'primary' && !disabled, // Dark
        'bg-gray-100 border-gray-200 text-gray-400': type === 'primary' && disabled, // Disabled style
        'dark:bg-white/5 dark:border-white/5 dark:text-white/20': type === 'primary' && disabled,

        // Text (Icon Button)
        'p-1.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10 active:scale-95': type === 'text' && !disabled,
        'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200': type === 'text' && !disabled,
        'text-gray-300 dark:text-gray-600': type === 'text' && disabled,
      }, className)}
      onClick={disabled ? undefined : onClick}
      tabIndex={-1}
      disabled={disabled}
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
