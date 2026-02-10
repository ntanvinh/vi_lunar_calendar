import React, {PropsWithChildren, useState} from 'react';
import clsx from 'clsx';
import Tooltip, {TooltipProps} from '/@/components/Tooltip';
import {BiCrown} from '@react-icons/all-files/bi/BiCrown';
import {useLicense, TrustModal} from '/@/lib/trust-license';

interface AppButtonProps extends TooltipProps {
  type?: 'primary' | 'text';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  tabIndex?: number;
  premiumFeature?: string; // If set, this button requires premium
  premiumFeatureName?: string; // Display name for the modal
}

const AppButton: React.FC<PropsWithChildren<AppButtonProps>> = (props) => {
  const {
    onClick, 
    children, 
    type = 'primary', 
    tip, 
    position, 
    className, 
    disabled, 
    tabIndex,
    premiumFeature,
    premiumFeatureName
  } = props;

  const {manager} = useLicense();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Check if button is locked
  // It is locked if premiumFeature is set AND it is NOT unlocked
  const isLocked = premiumFeature ? !manager.isFeatureUnlocked(premiumFeature) : false;

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;

    if (isLocked) {
      e.stopPropagation();
      e.preventDefault();
      setShowPremiumModal(true);
      return;
    }

    onClick?.();
  };

  return (
    <>
      <button
        className={clsx('relative rounded-md outline-none transition-all duration-200 text-[13px] font-medium', {
          // Disabled state
          'opacity-50 cursor-not-allowed': disabled,
          
          // Focus styles (macOS style)
          'focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]': !disabled,

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
        onClick={handleClick}
        tabIndex={tabIndex}
        disabled={disabled}
      >
        {
          tip ?
            <Tooltip tip={isLocked ? `${tip} (Premium)` : tip} position={position}>
              <div className="flex items-center gap-1.5">
                {children}
                {isLocked && (
                  <BiCrown size={14} className="text-yellow-500 absolute -top-2 -right-2 drop-shadow-md transform rotate-12 z-10" />
                )}
              </div>
            </Tooltip>
            :
            <div className="flex items-center gap-1.5 relative">
              {children}
              {isLocked && (
                <BiCrown size={14} className="text-yellow-500 absolute -top-2 -right-2 drop-shadow-md transform rotate-12 z-10" />
              )}
            </div>
        }
      </button>

      {showPremiumModal && (
        <TrustModal 
          onClose={() => setShowPremiumModal(false)} 
          featureId={premiumFeature}
        />
      )}
    </>
  );
};

export default AppButton;
