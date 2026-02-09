import React, {useState} from 'react';
import AppButton from '/@/components/button/AppButton';
import {BiBell} from '@react-icons/all-files/bi/BiBell';
import {BiCheckSquare} from '@react-icons/all-files/bi/BiCheckSquare';
import clsx from 'clsx';

interface GlobalNotificationConfigModalProps {
  onClose: () => void;
  onSave: (config: {
    applyEnabled: boolean;
    enabled: boolean;
    applyNotifyBefore: boolean;
    notifyBefore: number;
    applyContinuous: boolean;
    continuous: boolean;
    onlyImportant: boolean;
  }) => void;
}

const GlobalNotificationConfigModal: React.FC<GlobalNotificationConfigModalProps> = ({
  onClose,
  onSave,
}) => {
  const [applyEnabled, setApplyEnabled] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const [applyNotifyBefore, setApplyNotifyBefore] = useState(false);
  const [notifyBefore, setNotifyBefore] = useState(1);

  const [applyContinuous, setApplyContinuous] = useState(false);
  const [continuous, setContinuous] = useState(false);
  
  const [onlyImportant, setOnlyImportant] = useState(false);

  const handleSave = () => {
    onSave({
      applyEnabled,
      enabled,
      applyNotifyBefore,
      notifyBefore,
      applyContinuous,
      continuous,
      onlyImportant,
    });
  };

  const isAnySelected = applyEnabled || applyNotifyBefore || applyContinuous;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <BiBell
            className="text-[#007AFF]"
            size={20}
          />
          Cấu hình thông báo chung
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Chọn các cài đặt bạn muốn áp dụng cho <strong>tất cả</strong> sự kiện. Các cài đặt không
          được chọn sẽ giữ nguyên giá trị hiện tại của từng sự kiện.
        </p>

        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyImportant}
              onChange={e => setOnlyImportant(e.target.checked)}
              className="w-4 h-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500 cursor-pointer accent-yellow-600"
            />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Chỉ áp dụng cho các sự kiện quan trọng (Important)
            </span>
          </label>
        </div>

        <div className="space-y-4">
          {/* Enabled Config */}
          <div className="p-3 bg-gray-50 dark:bg-[#252525] rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                checked={applyEnabled}
                onChange={e => setApplyEnabled(e.target.checked)}
                className="w-4 h-4 text-[#007AFF] rounded border-gray-300 focus:ring-[#007AFF] cursor-pointer accent-[#007AFF]"
                id="applyEnabled"
              />
              <label
                htmlFor="applyEnabled"
                className="text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer flex-1"
              >
                Trạng thái bật/tắt
              </label>
            </div>

            <div
              className={clsx('pl-7 transition-all', {
                'opacity-50 pointer-events-none': !applyEnabled,
              })}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Thiết lập thành:</span>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={enabled}
                    onChange={e => setEnabled(e.target.checked)}
                  />
                  <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                    {enabled ? 'Bật' : 'Tắt'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Notify Before Config */}
          <div className="p-3 bg-gray-50 dark:bg-[#252525] rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                checked={applyNotifyBefore}
                onChange={e => setApplyNotifyBefore(e.target.checked)}
                className="w-4 h-4 text-[#007AFF] rounded border-gray-300 focus:ring-[#007AFF] cursor-pointer accent-[#007AFF]"
                id="applyNotifyBefore"
              />
              <label
                htmlFor="applyNotifyBefore"
                className="text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer flex-1"
              >
                Thời gian thông báo
              </label>
            </div>

            <div
              className={clsx('pl-7 transition-all', {
                'opacity-50 pointer-events-none': !applyNotifyBefore,
              })}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Báo trước:</span>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={notifyBefore}
                  onChange={e => setNotifyBefore(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#2C2C2C] text-gray-900 dark:text-white focus:ring-1 focus:ring-[#007AFF] outline-none"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">ngày</span>
              </div>
            </div>
          </div>

          {/* Continuous Config */}
          <div className="p-3 bg-gray-50 dark:bg-[#252525] rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={applyContinuous}
                onChange={e => {
                  setApplyContinuous(e.target.checked);
                  setContinuous(e.target.checked);
                }}
                className="w-4 h-4 text-[#007AFF] rounded border-gray-300 focus:ring-[#007AFF] cursor-pointer accent-[#007AFF]"
                id="applyContinuous"
              />
              <label
                htmlFor="applyContinuous"
                className="text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer flex-1"
              >
                Bật nhắc nhở hàng ngày (cho đến khi sự kiện diễn ra)
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          <AppButton
            onClick={onClose}
            type="text"
            className="!bg-gray-100 dark:!bg-gray-800 !text-gray-700 dark:!text-gray-300 hover:!bg-gray-200 dark:hover:!bg-gray-700 font-medium"
          >
            Hủy
          </AppButton>
          <AppButton
            onClick={handleSave}
            disabled={!isAnySelected}
            className={clsx('font-medium px-6 shadow-lg', {
              '!bg-[#007AFF] hover:!bg-[#0062CC] text-white shadow-blue-500/30': isAnySelected,
              '!bg-gray-300 dark:!bg-gray-700 text-gray-500 cursor-not-allowed shadow-none':
                !isAnySelected,
            })}
          >
            Áp dụng
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default GlobalNotificationConfigModal;
