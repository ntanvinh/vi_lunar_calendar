import React, {PropsWithChildren} from 'react';
import clsx from 'clsx';

export interface TooltipProps {
  tip?: string;
  position?: 'top' | 'bottom' | 'left' | 'tl' | 'bl';
}

const Tooltip: React.FC<PropsWithChildren<TooltipProps>> = ({children, tip, position = 'top'}) => {

  return (
    <div className="group relative">
      {children}
      <span className={clsx('z-50 absolute w-20 scale-0 transition-all rounded bg-black/70 p-2 text-xs text-white group-hover:scale-100', {
        '-top-8 -left-6': position === 'top',
        '-top-8 -left-16': position === 'tl',
        '-bottom-14 -left-8 ': position === 'bottom',
        '-bottom-14 -left-16 ': position === 'bl',
        '-top-4 -left-24': position === 'left',
      })}
      >
        {tip}
      </span>
    </div>
  );
};

export default Tooltip;
