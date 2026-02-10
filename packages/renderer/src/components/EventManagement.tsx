import React, {useEffect, useRef, useState} from 'react';
import {DEFAULT_EVENTS, type CalendarEvent} from '../../../common/src/EventData';
import {BiTrash} from '@react-icons/all-files/bi/BiTrash';
import {BiEdit} from '@react-icons/all-files/bi/BiEdit';
import {BiPlus} from '@react-icons/all-files/bi/BiPlus';
import {BiReset} from '@react-icons/all-files/bi/BiReset';
import {BiCheck} from '@react-icons/all-files/bi/BiCheck';
import {BiX} from '@react-icons/all-files/bi/BiX';
import {BiDownload} from '@react-icons/all-files/bi/BiDownload';
import {BiUpload} from '@react-icons/all-files/bi/BiUpload';
import {BiInfoCircle} from '@react-icons/all-files/bi/BiInfoCircle';
import {BiErrorCircle} from '@react-icons/all-files/bi/BiErrorCircle';
import {BiCheckCircle} from '@react-icons/all-files/bi/BiCheckCircle';
import {BiFilter} from '@react-icons/all-files/bi/BiFilter';
import {BiCaretUp} from '@react-icons/all-files/bi/BiCaretUp';
import {BiCaretDown} from '@react-icons/all-files/bi/BiCaretDown';
import {BiSort} from '@react-icons/all-files/bi/BiSort';
import {BiUser} from '@react-icons/all-files/bi/BiUser';
import {BiBell} from '@react-icons/all-files/bi/BiBell';
import {BiCog} from '@react-icons/all-files/bi/BiCog';
import {BiArrowBack} from '@react-icons/all-files/bi/BiArrowBack';
import {BiCrown} from '@react-icons/all-files/bi/BiCrown';
import clsx from 'clsx';
import NotificationConfigModal from './NotificationConfigModal';
import GlobalNotificationConfigModal from './GlobalNotificationConfigModal';
import { TrustModal, useLicense } from '/@/lib/trust-license';
import AppButton from '/@/components/button/AppButton';

interface EventManagementProps {
  onBack: () => void;
}

function removeAccents(str: string) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export default function EventManagement() {
  const { manager } = useLicense();
  const isMac = navigator.userAgent.includes('Mac');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CalendarEvent>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [notificationModal, setNotificationModal] = useState<{visible: boolean; event: CalendarEvent | null}>({visible: false, event: null});
  const [showGlobalConfigModal, setShowGlobalConfigModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  useEffect(() => {
    const cleanup = (window as any).ipc?.onPaymentRequested(() => {
      setShowPaymentModal(true);
    });
    return cleanup;
  }, []);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'solar' | 'lunar'>('all');
  const [filterImportant, setFilterImportant] = useState<'all' | 'true' | 'false'>('all');

  // Sort states
  const [sortConfig, setSortConfig] = useState<{key: keyof CalendarEvent; direction: 'asc' | 'desc'} | null>(null);
  
  const addFormRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (showAddForm && addFormRef.current) {
      addFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showAddForm]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Hotkey listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + A (Option + A on Mac) to add new event
      // Using code 'KeyA' to be layout independent
      if (e.altKey && (e.code === 'KeyA' || e.key.toLowerCase() === 'a' || e.key === 'å')) {
        e.preventDefault();
        console.log('Hotkey triggered: Alt+A');
        setShowAddForm(true);
        setEditForm({type: 'solar', isImportant: false});
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({message, type});
  };

  const isUserEvent = (event: CalendarEvent) => {
    return !DEFAULT_EVENTS.some(def => 
      def.title === event.title && 
      def.day === event.day && 
      def.month === event.month && 
      def.type === event.type,
    );
  };

  const getEventManager = () => {
    return (window as any).eventManager;
  };

  useEffect(() => {
    const loadEvents = async () => {
      const api = getEventManager();
      if (api) {
        try {
          console.log('Loading events...');
          const data = await api.getEvents();
          console.log('Events loaded:', data);
          setEvents(data);
        } catch (e) {
          console.error('Failed to load events', e);
        }
      } else {
        console.error('eventManager API is missing on window object');
      }
    };
    loadEvents();
  }, []);

  const handleDelete = async (id: string) => {
    const api = getEventManager();
    if (api) {
      const confirmed = await api.showConfirmDialog({
        title: 'Xóa sự kiện',
        message: 'Bạn có chắc chắn muốn xóa ngày lễ này?',
        type: 'warning',
      });
      
      if (confirmed) {
        const updated = await api.deleteEvent(id);
        setEvents(updated);
        showNotification('Đã xóa sự kiện', 'success');
      }
    }
  };

  const handleSave = async (event: Partial<CalendarEvent>) => {
    if (!event.title || !event.day || !event.month) {
      showNotification('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }
    const api = getEventManager();
    if (api) {
      const updated = await api.saveEvent(event as any);
      setEvents(updated);
      setIsEditing(null);
      setShowAddForm(false);
      setEditForm({});
      showNotification('Lưu sự kiện thành công', 'success');
    }
  };

  const handleSaveNotification = async (updatedEvent: CalendarEvent) => {
    const api = getEventManager();
    if (api) {
      try {
        const updatedEvents = await api.saveEvent(updatedEvent);
        setEvents(updatedEvents);
        setNotificationModal({visible: false, event: null});
        showNotification('Lưu cấu hình thông báo thành công', 'success');
      } catch (e) {
        console.error('Failed to save notification config', e);
        showNotification('Lưu cấu hình thất bại', 'error');
      }
    }
  };

  const handleSaveGlobalConfig = async (config: {
    applyEnabled: boolean;
    enabled: boolean;
    applyNotifyBefore: boolean;
    notifyBefore: number;
    applyContinuous: boolean;
    continuous: boolean;
    onlyImportant: boolean;
  }) => {
    const api = getEventManager();
    if (api) {
      try {
        // Clone current events to avoid direct mutation
        const updatedEvents = events.map(event => {
          // Skip if only applying to important events and this event is not important
          if (config.onlyImportant && !event.isImportant) {
            return event;
          }

          // Create a new notification config based on current one or default
          const currentNotification = event.notification || {
            enabled: true,
            notifyBefore: 1,
            continuous: false
          };
          
          const newNotification = {...currentNotification};
          
          if (config.applyEnabled) {
            newNotification.enabled = config.enabled;
          }
          
          if (config.applyNotifyBefore) {
            newNotification.notifyBefore = config.notifyBefore;
          }
          
          if (config.applyContinuous) {
            newNotification.continuous = config.continuous;
          }
          
          return {
            ...event,
            notification: newNotification
          };
        });
        
        const savedEvents = await api.saveAllEvents(updatedEvents);
        setEvents(savedEvents);
        setShowGlobalConfigModal(false);
        showNotification('Đã áp dụng cài đặt cho tất cả sự kiện', 'success');
      } catch (e) {
        console.error('Failed to save global config', e);
        showNotification('Áp dụng cài đặt thất bại', 'error');
      }
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    const oldTitle = editForm.title || '';
    
    let newType = editForm.type;
    
    // Auto-switch to Lunar if "Giỗ" is typed (case insensitive)
    // Only switch if the keyword is newly added to allow user to switch back to solar manually
    if (newTitle.toLowerCase().includes('giỗ') && !oldTitle.toLowerCase().includes('giỗ')) {
      newType = 'lunar';
    }
    
    setEditForm({...editForm, title: newTitle, type: newType});
  };

  const startEdit = (event: CalendarEvent) => {
    setIsEditing(event.id);
    setEditForm({...event});
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setShowAddForm(false);
    setEditForm({});
  };

  const handleResetDefaults = async () => {
    const api = getEventManager();
    if (api) {
      const confirmed = await api.showConfirmDialog({
        title: 'Khôi phục mặc định',
        message: 'Hành động này sẽ xóa tất cả dữ liệu hiện tại và khôi phục về mặc định.',
        detail: 'Bạn có chắc chắn muốn tiếp tục không?',
        type: 'warning',
      });

      if (confirmed) {
        const updated = await api.resetDefaultEvents();
        setEvents(updated);
        showNotification('Đã khôi phục dữ liệu mặc định', 'success');
      }
    }
  };

  const handleExport = async () => {
    // Check for premium (using a direct check since this function is called from a button)
    // The button itself will handle the blocking and modal display via AppButton's premiumFeature prop.
    // However, if called programmatically or if the check fails for some reason, we do a safety check.
    // Since we are migrating to AppButton for these actions, the logic moves there.
    // For now, let's keep the function as is, but we will wrap the UI elements with AppButton
    
    const api = getEventManager();
    if (api) {
      try {
        const success = await api.exportEventsCSV();
        if (success) {
          showNotification('Xuất file thành công!', 'success');
        }
      } catch (e) {
        console.error('Export failed', e);
        showNotification('Xuất file thất bại', 'error');
      }
    }
  };

  const handleImport = async () => {
    const api = getEventManager();
    if (api) {
      const confirmed = await api.showConfirmDialog({
        title: 'Nhập dữ liệu',
        message: 'Hành động này sẽ xóa toàn bộ dữ liệu sự kiện hiện tại và thay thế bằng dữ liệu từ file.',
        detail: 'Bạn có chắc chắn muốn tiếp tục?',
        type: 'warning',
      });

      if (!confirmed) return;

      try {
        const updated = await api.importEventsCSV();
        if (updated) {
          setEvents(updated);
          showNotification('Nhập file thành công!', 'success');
        }
      } catch (e) {
        console.error('Import failed', e);
        showNotification('Nhập file thất bại. Vui lòng kiểm tra định dạng file.', 'error');
      }
    }
  };

  const handleSort = (key: keyof CalendarEvent) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({key, direction});
  };

  const getFilteredEvents = () => {
    const filtered = events.filter(event => {
      const matchText = searchText === '' || removeAccents(event.title.toLowerCase()).includes(removeAccents(searchText.toLowerCase()));
      const matchType = filterType === 'all' || event.type === filterType;
      const matchImportant = filterImportant === 'all' || 
        (filterImportant === 'true' && event.isImportant) || 
        (filterImportant === 'false' && !event.isImportant);
      return matchText && matchType && matchImportant;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const key = sortConfig.key;
        const valA = a[key];
        const valB = b[key];

        if (valA === undefined && valB === undefined) return 0;
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;

        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        
        // Secondary sort: if sorting by month, also sort by day
        if (key === 'month') {
          return (a.day - b.day) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        
        return 0;
      });
    }

    return filtered;
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div className="h-screen flex flex-col text-gray-900 dark:text-gray-100 drag-region overflow-hidden">
      <div className="pt-10 px-6 pb-2 shrink-0">
        <div className="max-w-4xl mx-auto w-full no-drag-region">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Quản lý Ngày lễ & Sự kiện</h1>
            <div className="flex gap-2">
              <AppButton
                onClick={handleImport}
                className="bg-white dark:bg-[#2c2c2e] border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]"
                tip="Nhập dữ liệu từ file CSV"
                premiumFeature="import_export"
              >
                <BiDownload size={15} /> Nhập CSV
              </AppButton>
              <AppButton
                onClick={handleExport}
                className="bg-white dark:bg-[#2c2c2e] border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]"
                tip="Xuất dữ liệu ra file CSV"
                premiumFeature="import_export"
              >
                <BiUpload size={15} /> Xuất CSV
              </AppButton>
              <AppButton
                onClick={() => setShowGlobalConfigModal(true)}
                className="bg-white dark:bg-[#2c2c2e] border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]"
                tip="Cài đặt thông báo chung"
                premiumFeature="global_config"
              >
                <BiCog size={15} /> Cài đặt chung
              </AppButton>
              <div className="w-px bg-gray-300 dark:bg-white/10 mx-1 h-6 self-center"></div>
              <button
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded-md transition-all duration-200 border shadow-sm active:scale-95 bg-white dark:bg-[#2c2c2e] border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]"
                title="Khôi phục danh sách mặc định"
              >
                <BiReset size={15} /> Khôi phục
              </button>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditForm({type: 'solar', isImportant: false});
                }}
                className="flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded-md transition-all duration-200 border shadow-sm active:scale-95 bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500 text-white hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]"
                title={isMac ? "Thêm sự kiện mới (⌥A)" : "Thêm sự kiện mới (Alt + A)"}
              >
                <BiPlus size={15} /> Thêm mới
              </button>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className={clsx(
          'fixed top-6 right-6 px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100 backdrop-blur-md border',
          {
            'bg-white/90 dark:bg-slate-800/90 border-green-200 dark:border-green-900 text-green-800 dark:text-green-100': notification.type === 'success',
            'bg-white/90 dark:bg-slate-800/90 border-red-200 dark:border-red-900 text-red-800 dark:text-red-100': notification.type === 'error',
            'bg-white/90 dark:bg-slate-800/90 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-100': notification.type === 'info',
          },
        )}>
          {notification.type === 'success' && <BiCheckCircle size={20} className="text-green-500 dark:text-green-400" />}
          {notification.type === 'error' && <BiErrorCircle size={20} className="text-red-500 dark:text-red-400" />}
          {notification.type === 'info' && <BiInfoCircle size={20} className="text-blue-500 dark:text-blue-400" />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      <div className="flex-1 overflow-hidden px-6 pb-6 no-drag-region flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-0">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10 shadow-sm">
                <th 
                  className="sticky top-0 z-10 bg-gray-50 dark:bg-[#2c2c2e] px-4 py-3 font-semibold first:rounded-tl-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-colors group select-none"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-2">
                    Tên sự kiện
                    {sortConfig?.key === 'title' ? (
                      sortConfig.direction === 'asc' ? <BiCaretUp size={14} /> : <BiCaretDown size={14} />
                    ) : (
                      <BiSort size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFilters(!showFilters);
                      }}
                      className={clsx('ml-auto p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]', {
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400': showFilters || searchText || filterType !== 'all' || filterImportant !== 'all',
                      })}
                      title="Lọc sự kiện"
                    >
                      <BiFilter size={14} />
                    </button>
                  </div>
                </th>
                <th 
                  className="sticky top-0 z-10 bg-gray-50 dark:bg-[#2c2c2e] px-4 py-3 font-semibold w-32 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-colors group select-none"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    Loại lịch
                    {sortConfig?.key === 'type' ? (
                      sortConfig.direction === 'asc' ? <BiCaretUp size={14} /> : <BiCaretDown size={14} />
                    ) : (
                      <BiSort size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th 
                  className="sticky top-0 z-10 bg-gray-50 dark:bg-[#2c2c2e] px-4 py-3 font-semibold w-24 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-colors group select-none"
                  onClick={() => handleSort('day')}
                >
                  <div className="flex items-center gap-1">
                    Ngày
                    {sortConfig?.key === 'day' ? (
                      sortConfig.direction === 'asc' ? <BiCaretUp size={14} /> : <BiCaretDown size={14} />
                    ) : (
                      <BiSort size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th 
                  className="sticky top-0 z-10 bg-gray-50 dark:bg-[#2c2c2e] px-4 py-3 font-semibold w-24 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-colors group select-none"
                  onClick={() => handleSort('month')}
                >
                  <div className="flex items-center gap-1">
                    Tháng
                    {sortConfig?.key === 'month' ? (
                      sortConfig.direction === 'asc' ? <BiCaretUp size={14} /> : <BiCaretDown size={14} />
                    ) : (
                      <BiSort size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th 
                  className="sticky top-0 z-10 bg-gray-50 dark:bg-[#2c2c2e] px-4 py-3 font-semibold w-28 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-colors group select-none"
                  onClick={() => handleSort('isImportant')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Quan trọng
                    {sortConfig?.key === 'isImportant' ? (
                      sortConfig.direction === 'asc' ? <BiCaretUp size={14} /> : <BiCaretDown size={14} />
                    ) : (
                      <BiSort size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th className="sticky top-0 z-10 bg-gray-50 dark:bg-[#2c2c2e] px-4 py-3 font-semibold w-24 text-right last:rounded-tr-xl">Thao tác</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              <tr className={clsx('transition-all duration-300 ease-in-out border-b-0 overflow-hidden', {
                'bg-gray-50/50 dark:bg-[#2c2c2e]': showFilters,
                'bg-transparent': !showFilters,
              })}>
                <td className={clsx('px-4 transition-all duration-300 ease-in-out', showFilters ? 'py-2' : 'py-0 border-none')}>
                  <div className={clsx('overflow-hidden transition-all duration-300 ease-in-out', showFilters ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0')}>
                    <input
                      className="w-full text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] focus:outline-none focus:border-blue-500"
                      placeholder="Tìm kiếm..."
                      value={searchText}
                      onChange={e => setSearchText(e.target.value)}
                    />
                  </div>
                </td>
                <td className={clsx('px-4 transition-all duration-300 ease-in-out', showFilters ? 'py-2' : 'py-0 border-none')}>
                  <div className={clsx('overflow-hidden transition-all duration-300 ease-in-out', showFilters ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0')}>
                    <select
                      className="w-full text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] focus:outline-none focus:border-blue-500"
                      value={filterType}
                      onChange={e => setFilterType(e.target.value as any)}
                    >
                      <option value="all">Tất cả</option>
                      <option value="solar">Dương lịch</option>
                      <option value="lunar">Âm lịch</option>
                    </select>
                  </div>
                </td>
                <td className={clsx('px-4 transition-all duration-300 ease-in-out', showFilters ? 'py-2' : 'py-0 border-none')} colSpan={2}></td>
                <td className={clsx('px-4 transition-all duration-300 ease-in-out', showFilters ? 'py-2' : 'py-0 border-none text-center')}>
                  <div className={clsx('overflow-hidden transition-all duration-300 ease-in-out', showFilters ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0')}>
                    <select
                      className="w-full text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] focus:outline-none focus:border-blue-500"
                      value={filterImportant}
                      onChange={e => setFilterImportant(e.target.value as any)}
                    >
                      <option value="all">Tất cả</option>
                      <option value="true">Có</option>
                      <option value="false">Không</option>
                    </select>
                  </div>
                </td>
                <td className={clsx('px-4 transition-all duration-300 ease-in-out', showFilters ? 'py-2' : 'py-0 border-none')}></td>
              </tr>
              {filteredEvents.map(event => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  {isEditing === event.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          className="w-full bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none"
                          value={editForm.title || ''}
                          onChange={handleTitleChange}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none"
                          value={editForm.type}
                          onChange={e => setEditForm({...editForm, type: e.target.value as any})}
                        >
                          <option value="solar">Dương lịch</option>
                          <option value="lunar">Âm lịch</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="w-full bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none"
                          value={editForm.day}
                          onChange={e => setEditForm({...editForm, day: parseInt(e.target.value)})}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="w-full bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none"
                          value={editForm.month}
                          onChange={e => setEditForm({...editForm, month: parseInt(e.target.value)})}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={editForm.isImportant || false}
                          onChange={e => setEditForm({...editForm, isImportant: e.target.checked})}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleSave(editForm)} className="p-1.5 rounded-md text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]"><BiCheck size={16} /></button>
                          <button onClick={cancelEdit} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]"><BiX size={16} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {event.title}
                          {isUserEvent(event) && (
                            <span className="text-blue-500" title="Sự kiện người dùng tạo">
                              <BiUser size={16} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs', {
                          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300': event.type === 'lunar',
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': event.type === 'solar',
                        })}>
                          {event.type === 'lunar' ? 'Âm lịch' : 'Dương lịch'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{event.day}</td>
                      <td className="px-4 py-3">{event.month}</td>
                      <td className="px-4 py-3 text-center">
                        {event.isImportant && <span className="text-red-500">★</span>}
                      </td>
                      <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => setNotificationModal({visible: true, event})} 
                            className={clsx('p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]', {
                              'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10': !event.notification?.enabled,
                              'text-[#007AFF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40': event.notification?.enabled
                            })}
                            title="Cấu hình thông báo"
                          >
                            <BiBell size={16} />
                          </button>
                          <button onClick={() => startEdit(event)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]" title="Sửa"><BiEdit size={16} /></button>
                          <button onClick={() => handleDelete(event.id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]" title="Xóa"><BiTrash size={16} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {showAddForm && (
                <tr ref={addFormRef} className="bg-blue-50/50 dark:bg-blue-900/10">
                  <td className="px-4 py-3">
                    <input
                      className="w-full bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none"
                      placeholder="Tên sự kiện..."
                      value={editForm.title || ''}
                      onChange={handleTitleChange}
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none"
                      value={editForm.type}
                      onChange={e => setEditForm({...editForm, type: e.target.value as any})}
                    >
                      <option value="solar">Dương lịch</option>
                      <option value="lunar">Âm lịch</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none"
                      value={editForm.day || ''}
                      onChange={e => setEditForm({...editForm, day: parseInt(e.target.value)})}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none"
                      value={editForm.month || ''}
                      onChange={e => setEditForm({...editForm, month: parseInt(e.target.value)})}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={editForm.isImportant || false}
                      onChange={e => setEditForm({...editForm, isImportant: e.target.checked})}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleSave(editForm)} className="p-1.5 rounded-md text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]"><BiCheck size={18} /></button>
                      <button onClick={cancelEdit} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#007AFF]/60 dark:focus:ring-[#0A84FF]/60 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E]"><BiX size={18} /></button>
                    </div>
                  </td>
                </tr>
              )}
              </tbody>
            </table>
            {events.length === 0 && (
              <div className="p-8 text-center text-gray-500">Chưa có sự kiện nào.</div>
            )}
          </div>
        </div>
      </div>

      {notificationModal.visible && notificationModal.event && (
        <NotificationConfigModal
          event={notificationModal.event}
          onClose={() => setNotificationModal({visible: false, event: null})}
          onSave={handleSaveNotification}
        />
      )}

      {showGlobalConfigModal && (
        <GlobalNotificationConfigModal
          onClose={() => setShowGlobalConfigModal(false)}
          onSave={handleSaveGlobalConfig}
        />
      )}

      {showPaymentModal && (
        <TrustModal
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
