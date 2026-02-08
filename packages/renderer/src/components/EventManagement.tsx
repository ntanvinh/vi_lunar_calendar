import React, {useEffect, useState} from 'react';
import type {CalendarEvent} from '../../../common/src/EventData';
import {MdDelete} from '@react-icons/all-files/md/MdDelete';
import {MdEdit} from '@react-icons/all-files/md/MdEdit';
import {MdAdd} from '@react-icons/all-files/md/MdAdd';
import {MdRefresh} from '@react-icons/all-files/md/MdRefresh';
import {MdCheck} from '@react-icons/all-files/md/MdCheck';
import {MdClose} from '@react-icons/all-files/md/MdClose';
import clsx from 'clsx';

export default function EventManagement() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CalendarEvent>>({});
  const [showAddForm, setShowAddForm] = useState(false);

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
    if (confirm('Bạn có chắc chắn muốn xóa ngày lễ này?')) {
      const api = getEventManager();
      if (api) {
        const updated = await api.deleteEvent(id);
        setEvents(updated);
      }
    }
  };

  const handleSave = async (event: Partial<CalendarEvent>) => {
    if (!event.title || !event.day || !event.month) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const api = getEventManager();
    if (api) {
      const updated = await api.saveEvent(event as any);
      setEvents(updated);
      setIsEditing(null);
      setShowAddForm(false);
      setEditForm({});
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
    if (confirm('Hành động này sẽ xóa tất cả dữ liệu hiện tại và khôi phục về mặc định. Bạn có chắc chắn không?')) {
      if ((window as any).eventManager) {
        const updated = await (window as any).eventManager.resetDefaultEvents();
        setEvents(updated);
      } else {
        console.error('eventManager API is missing');
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
                onClick={handleResetDefaults}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded transition"
              >
                <MdRefresh /> Khôi phục mặc định
              </button>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditForm({type: 'solar', isImportant: false});
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition shadow-sm"
              >
                <MdAdd /> Thêm mới
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 no-drag-region">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50 text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700">
                <th className="px-4 py-3 font-semibold">Tên sự kiện</th>
                <th className="px-4 py-3 font-semibold w-32">Loại lịch</th>
                <th className="px-4 py-3 font-semibold w-24">Ngày</th>
                <th className="px-4 py-3 font-semibold w-24">Tháng</th>
                <th className="px-4 py-3 font-semibold w-24 text-center">Quan trọng</th>
                <th className="px-4 py-3 font-semibold w-24 text-right">Thao tác</th>
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
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleSave(editForm)} className="text-green-600 hover:text-green-700"><MdCheck size={18} /></button>
                          <button onClick={cancelEdit} className="text-red-500 hover:text-red-600"><MdClose size={18} /></button>
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
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEdit(event)} className="text-gray-500 hover:text-blue-600 p-1"><MdEdit size={16} /></button>
                          <button onClick={() => handleDelete(event.id)} className="text-gray-500 hover:text-red-600 p-1"><MdDelete size={16} /></button>
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
