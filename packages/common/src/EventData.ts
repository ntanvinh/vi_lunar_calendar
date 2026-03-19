export type EventType = 'lunar' | 'solar';

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  day: number;
  month: number;
  isImportant: boolean;
  isReadOnly?: boolean;
  source?: 'default' | 'user' | 'dynamic-yearly';
  notification?: {
    enabled: boolean;
    notifyBefore: number; // days
    continuous: boolean;
  };
}

export const DEFAULT_EVENTS: Omit<CalendarEvent, 'id'>[] = [
  // Solar Holidays
  { title: 'Tết Dương Lịch', type: 'solar', day: 1, month: 1, isImportant: true },
  { title: 'Valentine', type: 'solar', day: 14, month: 2, isImportant: false },
  { title: 'Ngày Thầy thuốc Việt Nam', type: 'solar', day: 27, month: 2, isImportant: false },
  { title: 'Quốc tế Phụ nữ', type: 'solar', day: 8, month: 3, isImportant: true },
  { title: 'Valentine Trắng', type: 'solar', day: 14, month: 3, isImportant: false },
  { title: 'Ngày Quốc tế Hạnh phúc', type: 'solar', day: 20, month: 3, isImportant: false },
  { title: 'Ngày thành lập Đoàn TNCS Hồ Chí Minh', type: 'solar', day: 26, month: 3, isImportant: false },
  { title: 'Ngày Cá tháng Tư', type: 'solar', day: 1, month: 4, isImportant: false },
  { title: 'Ngày Trái Đất', type: 'solar', day: 22, month: 4, isImportant: false },
  { title: 'Giải phóng miền Nam', type: 'solar', day: 30, month: 4, isImportant: true },
  { title: 'Quốc tế Lao động', type: 'solar', day: 1, month: 5, isImportant: true },
  { title: 'Ngày Quốc tế Thiếu nhi', type: 'solar', day: 1, month: 6, isImportant: false },
  { title: 'Ngày Gia đình Việt Nam', type: 'solar', day: 28, month: 6, isImportant: false },
  { title: 'Ngày Thương binh Liệt sĩ', type: 'solar', day: 27, month: 7, isImportant: true },
  { title: 'Quốc khánh', type: 'solar', day: 2, month: 9, isImportant: true },
  { title: 'Ngày Doanh nhân Việt Nam', type: 'solar', day: 13, month: 10, isImportant: false },
  { title: 'Ngày Phụ nữ Việt Nam', type: 'solar', day: 20, month: 10, isImportant: false },
  { title: 'Halloween', type: 'solar', day: 31, month: 10, isImportant: true },
  { title: 'Ngày Quốc tế Nam giới', type: 'solar', day: 19, month: 11, isImportant: false },
  { title: 'Ngày Nhà giáo Việt Nam', type: 'solar', day: 20, month: 11, isImportant: false },
  { title: 'Ngày thành lập Quân đội Nhân dân Việt Nam', type: 'solar', day: 22, month: 12, isImportant: false },
  { title: 'Giáng sinh', type: 'solar', day: 25, month: 12, isImportant: false },

  // Lunar Holidays
  { title: 'Tết Nguyên Đán', type: 'lunar', day: 1, month: 1, isImportant: true },
  { title: 'Tết Nguyên Tiêu', type: 'lunar', day: 15, month: 1, isImportant: false },
  { title: 'Hàn thực', type: 'lunar', day: 3, month: 3, isImportant: false },
  { title: 'Phật Đản', type: 'lunar', day: 15, month: 4, isImportant: false },
  { title: 'Tết Đoan Ngọ', type: 'lunar', day: 5, month: 5, isImportant: false },
  { title: 'Vu Lan', type: 'lunar', day: 15, month: 7, isImportant: false },
  { title: 'Tết Trung Thu', type: 'lunar', day: 15, month: 8, isImportant: true },
  { title: 'Giỗ Tổ Hùng Vương', type: 'lunar', day: 10, month: 3, isImportant: true },
  { title: 'Ông Công Ông Táo', type: 'lunar', day: 23, month: 12, isImportant: true },
];
