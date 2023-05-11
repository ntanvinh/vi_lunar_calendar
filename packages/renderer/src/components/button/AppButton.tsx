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
      className={clsx('text-white rounded-lg outline-none', {
        'px-4 py-1 bg-blue-700 hover:bg-blue-600': type === 'primary',
        'px-2 py-1': type === 'text',
      })}
      onClick={onClick}
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
