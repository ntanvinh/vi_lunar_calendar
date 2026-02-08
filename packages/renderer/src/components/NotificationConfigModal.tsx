import React, {useState} from 'react';
import {CalendarEvent} from '../../../common/src/EventData';
import AppButton from '/@/components/button/AppButton';
import {BiBell} from '@react-icons/all-files/bi/BiBell';
import {BiSend} from '@react-icons/all-files/bi/BiSend';
import clsx from 'clsx';

interface NotificationConfigModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
}

const NotificationConfigModal: React.FC<NotificationConfigModalProps> = ({event, onClose, onSave}) => {
  const [enabled, setEnabled] = useState(event.notification?.enabled ?? false);
  const [notifyBefore, setNotifyBefore] = useState(event.notification?.notifyBefore ?? 1);
  const [continuous, setContinuous] = useState(event.notification?.continuous ?? false);

  const handleSave = () => {
    onSave({
      ...event,
      notification: {
        enabled,
        notifyBefore,
        continuous,
      },
    });
  };

  const handleTest = async () => {
    const tempEvent = {
      ...event,
      notification: {
        enabled,
        notifyBefore,
        continuous,
      },
    };
    const api = (window as any).eventManager;
    if (api && api.testNotification) {
      await api.testNotification(tempEvent);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <BiBell className="text-[#007AFF]" size={20} />
          Cấu hình thông báo
        </h3>
        
        <div className="space-y-5">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#252525] rounded-lg">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer" onClick={() => setEnabled(!enabled)}>Bật thông báo</label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 text-[#007AFF] rounded border-gray-300 focus:ring-[#007AFF] cursor-pointer accent-[#007AFF]"
            />
          </div>

          <div className={clsx('space-y-4 transition-all duration-300', {
            'opacity-50 pointer-events-none grayscale': !enabled,
            'opacity-100': enabled
          })}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Thông báo trước (ngày)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={notifyBefore}
                  onChange={(e) => setNotifyBefore(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 pl-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2C2C2C] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium pointer-events-none">ngày</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-gray-100 dark:border-gray-700/50 rounded-lg">
              <input
                type="checkbox"
                id="continuous"
                checked={continuous}
                onChange={(e) => setContinuous(e.target.checked)}
                className="mt-1 w-4 h-4 text-[#007AFF] rounded border-gray-300 focus:ring-[#007AFF] cursor-pointer accent-[#007AFF]"
              />
              <div className="flex-1">
                <label htmlFor="continuous" className="block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Nhắc nhở hàng ngày
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Nếu bật, hệ thống sẽ gửi thông báo mỗi ngày một lần bắt đầu từ {notifyBefore} ngày trước khi sự kiện diễn ra.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          <AppButton onClick={handleTest} type="text" className="!text-[#007AFF] hover:!bg-blue-50 dark:hover:!bg-blue-900/20 font-medium flex items-center gap-2" tip="Gửi thông báo thử nghiệm">
            <BiSend /> Test
          </AppButton>
          <div className="flex gap-3">
            <AppButton onClick={onClose} type="text" className="!bg-gray-100 dark:!bg-gray-800 !text-gray-700 dark:!text-gray-300 hover:!bg-gray-200 dark:hover:!bg-gray-700 font-medium">
              Hủy
            </AppButton>
            <AppButton onClick={handleSave} className="!bg-[#007AFF] hover:!bg-[#0062CC] text-white shadow-lg shadow-blue-500/30 font-medium px-6">
              Lưu cấu hình
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationConfigModal;
