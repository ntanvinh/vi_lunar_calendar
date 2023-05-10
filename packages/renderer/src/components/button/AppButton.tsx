import React, {PropsWithChildren} from 'react';

interface AppButtonProps {
  onClick?: () => void;
}

const AppButton: React.FC<PropsWithChildren<AppButtonProps>> = (props) => {
  const {onClick, children} = props;

  return (
    <button
      className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded-lg"
      tabIndex={-1}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default AppButton;
