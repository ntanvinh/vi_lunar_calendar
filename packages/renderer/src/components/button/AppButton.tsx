import React, {PropsWithChildren} from 'react';
import clsx from 'clsx';

interface AppButtonProps {
  type?: 'primary' | 'text';
  onClick?: () => void;
}

const AppButton: React.FC<PropsWithChildren<AppButtonProps>> = (props) => {
  const {onClick, children, type='primary'} = props;

  return (
    <button
      className={clsx('px-2 py-1 text-white rounded-lg outline-none',{
        'bg-blue-700 hover:bg-blue-600': type === 'primary',

      })}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default AppButton;
