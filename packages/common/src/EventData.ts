export type EventType = 'lunar' | 'solar';

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  day: number;
  month: number;
  isImportant: boolean;
  notification?: {
    enabled: boolean;
    notifyBefore: number; // days
    continuous: boolean;
  };
}

export const DEFAULT_EVENTS: Omit<CalendarEvent, 'id'>[] = [
  // Solar Holidays
  { title: 'Tết Dương Lịch', type: 'solar', day: 1, month: 1, isImportant: true },
  { title: 'Ngày Chiến thắng', type: 'solar', day: 30, month: 4, isImportant: true },
  { title: 'Quốc tế Lao động', type: 'solar', day: 1, month: 5, isImportant: true },
  { title: 'Quốc khánh', type: 'solar', day: 2, month: 9, isImportant: true },
  { title: 'Ngày Phụ nữ Việt Nam', type: 'solar', day: 20, month: 10, isImportant: false },
  { title: 'Ngày Nhà giáo Việt Nam', type: 'solar', day: 20, month: 11, isImportant: false },
  { title: 'Giáng sinh', type: 'solar', day: 25, month: 12, isImportant: false },

  // Lunar Holidays
  { title: 'Ông Công Ông Táo', type: 'lunar', day: 23, month: 12, isImportant: true },
  { title: 'Tết Nguyên Đán', type: 'lunar', day: 1, month: 1, isImportant: true },
  { title: 'Tết Nguyên Tiêu', type: 'lunar', day: 15, month: 1, isImportant: false },
  { title: 'Giỗ Tổ Hùng Vương', type: 'lunar', day: 10, month: 3, isImportant: true },
  { title: 'Phật Đản', type: 'lunar', day: 15, month: 4, isImportant: false },
  { title: 'Tết Đoan Ngọ', type: 'lunar', day: 5, month: 5, isImportant: false },
  { title: 'Vu Lan', type: 'lunar', day: 15, month: 7, isImportant: false },
  { title: 'Tết Trung Thu', type: 'lunar', day: 15, month: 8, isImportant: true },
];
