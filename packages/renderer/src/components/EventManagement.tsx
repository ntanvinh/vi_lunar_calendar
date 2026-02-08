import React, {useEffect, useState} from 'react';
import type {CalendarEvent} from '../../../common/src/EventData';
import {MdDelete} from '@react-icons/all-files/md/MdDelete';
import {MdEdit} from '@react-icons/all-files/md/MdEdit';
import {MdAdd} from '@react-icons/all-files/md/MdAdd';
import {MdRefresh} from '@react-icons/all-files/md/MdRefresh';
import {MdCheck} from '@react-icons/all-files/md/MdCheck';
import {MdClose} from '@react-icons/all-files/md/MdClose';
import {MdFileDownload} from '@react-icons/all-files/md/MdFileDownload';
import {MdFileUpload} from '@react-icons/all-files/md/MdFileUpload';
import {MdInfo} from '@react-icons/all-files/md/MdInfo';
import {MdError} from '@react-icons/all-files/md/MdError';
import {MdCheckCircle} from '@react-icons/all-files/md/MdCheckCircle';
import clsx from 'clsx';

export default function EventManagement() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CalendarEvent>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({message, type});
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

  return (
    <div className="h-screen flex flex-col text-gray-900 dark:text-gray-100 drag-region overflow-hidden">
      <div className="pt-10 px-6 pb-2 shrink-0">
        <div className="max-w-4xl mx-auto w-full no-drag-region">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Quản lý Ngày lễ & Sự kiện</h1>
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded-md transition-all duration-200 border shadow-sm active:scale-95 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600"
                title="Nhập dữ liệu từ file CSV"
              >
                <MdFileUpload size={15} /> Nhập CSV
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded-md transition-all duration-200 border shadow-sm active:scale-95 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600"
                title="Xuất dữ liệu ra file CSV"
              >
                <MdFileDownload size={15} /> Xuất CSV
              </button>
              <div className="w-px bg-gray-300 dark:bg-slate-600 mx-1 h-6 self-center"></div>
              <button
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded-md transition-all duration-200 border shadow-sm active:scale-95 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600"
              >
                <MdRefresh size={15} /> Khôi phục
              </button>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditForm({type: 'solar', isImportant: false});
                }}
                className="flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded-md transition-all duration-200 border shadow-sm active:scale-95 bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500 text-white hover:bg-blue-600 dark:hover:bg-blue-700"
              >
                <MdAdd size={15} /> Thêm mới
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
          {notification.type === 'success' && <MdCheckCircle size={20} className="text-green-500 dark:text-green-400" />}
          {notification.type === 'error' && <MdError size={20} className="text-red-500 dark:text-red-400" />}
          {notification.type === 'info' && <MdInfo size={20} className="text-blue-500 dark:text-blue-400" />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-6 no-drag-region">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700 shadow-sm">
                <th className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-700 px-4 py-3 font-semibold first:rounded-tl-xl">Tên sự kiện</th>
                <th className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-700 px-4 py-3 font-semibold w-32">Loại lịch</th>
                <th className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-700 px-4 py-3 font-semibold w-24">Ngày</th>
                <th className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-700 px-4 py-3 font-semibold w-24">Tháng</th>
                <th className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-700 px-4 py-3 font-semibold w-24 text-center">Quan trọng</th>
                <th className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-700 px-4 py-3 font-semibold w-24 text-right last:rounded-tr-xl">Thao tác</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {showAddForm && (
                <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                  <td className="px-4 py-3">
                    <input
                      className="w-full bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none"
                      placeholder="Tên sự kiện..."
                      value={editForm.title || ''}
                      onChange={e => setEditForm({...editForm, title: e.target.value})}
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
                      <button onClick={() => handleSave(editForm)} className="text-green-600 hover:text-green-700"><MdCheck size={18} /></button>
                      <button onClick={cancelEdit} className="text-red-500 hover:text-red-600"><MdClose size={18} /></button>
                    </div>
                  </td>
                </tr>
              )}

              {events.map(event => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                  {isEditing === event.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          className="w-full bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none"
                          value={editForm.title || ''}
                          onChange={e => setEditForm({...editForm, title: e.target.value})}
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
                          <button onClick={() => handleSave(editForm)} className="p-1.5 rounded-md text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"><MdCheck size={16} /></button>
                          <button onClick={cancelEdit} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"><MdClose size={16} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{event.title}</td>
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
                          <button onClick={() => startEdit(event)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-blue-600 transition-colors"><MdEdit size={16} /></button>
                          <button onClick={() => handleDelete(event.id)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-red-600 transition-colors"><MdDelete size={16} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              </tbody>
            </table>
            {events.length === 0 && (
              <div className="p-8 text-center text-gray-500">Chưa có sự kiện nào.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
