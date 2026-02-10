import React, {useEffect, useState} from 'react';
import AppCalendar from '/@/components/calendar/AppCalendar';
import EventManagement from '/@/components/EventManagement';
import { LicenseProvider, LicenseConfig, TrustModal } from '/@/lib/trust-license';

const licenseConfig: LicenseConfig = {
  appName: 'V Lunar Calendar',
  bankInfo: {
    bankId: 'VPBank',
    accountNo: '0988181872',
    accountName: 'NGUYEN TAN VINH',
    template: 'compact',
  },
  features: [
    {
      id: 'import_export',
      name: 'Nhập/Xuất dữ liệu',
      price: 60000,
      description: 'Hỗ trợ nhập xuất dữ liệu CSV'
    },
    {
      id: 'global_config',
      name: 'Cấu hình thông báo chung',
      price: 60000,
      description: 'Tùy chỉnh cấu hình thông báo chung cho các sự kiện'
    }
  ],
  comboPrice: 100000,
  comboName: 'Gói Trọn Đời (Combo)',
  comboDescription: 'Mở khóa TOÀN BỘ tính năng'
};

export default function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    console.log('Current hash:', window.location.hash);
    const handleHashChange = () => {
      console.log('Hash changed:', window.location.hash);
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderContent = () => {
    if (hash === '#/events') {
      return <EventManagement />;
    }
    
    if (hash === '#/payment') {
      return (
        <div className="h-screen w-full bg-white dark:bg-[#1E1E1E] flex items-center justify-center">
          <TrustModal 
            onClose={() => window.close()} 
          />
        </div>
      );
    }

    return (
      <div
        className={''}
      >
        <AppCalendar />
      </div>
    );
  };

  return (
    <LicenseProvider config={licenseConfig}>
      {renderContent()}
    </LicenseProvider>
  );
}
