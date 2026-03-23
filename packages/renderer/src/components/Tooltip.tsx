import React, {PropsWithChildren, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';

export interface TooltipProps {
  tip?: string;
  position?: 'top' | 'bottom' | 'left' | 'tl' | 'bl';
}

const TOOLTIP_SHOW_DELAY_MS = 450;

const Tooltip: React.FC<PropsWithChildren<TooltipProps>> = ({children, tip, position = 'top'}) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const scheduleShow = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setVisible(true);
      timerRef.current = null;
    }, TOOLTIP_SHOW_DELAY_MS);
  };

  const hideTooltip = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={scheduleShow}
      onMouseLeave={hideTooltip}
      onFocus={scheduleShow}
      onBlur={hideTooltip}
    >
      {children}
      <span className={clsx('pointer-events-none z-50 absolute w-20 rounded bg-black/70 p-2 text-xs text-white transition-all', {
        'scale-100 opacity-100': visible,
        'scale-95 opacity-0': !visible,
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
