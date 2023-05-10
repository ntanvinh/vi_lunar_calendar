import React, {PropsWithChildren} from 'react';

interface TooltipProps {
  tip: string;
}

const Tooltip: React.FC<PropsWithChildren<TooltipProps>> = ({children, tip}) => {

  return (
    <div className="group relative">
      {children}
      <span className="z-50 bottom-5 -left-5 absolute scale-0 transition-all rounded bg-black/70 p-2 text-xs text-white group-hover:scale-100">{tip}</span>
    </div>
  );
};

export default Tooltip;
