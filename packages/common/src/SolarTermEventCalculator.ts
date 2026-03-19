export interface SolarTermDate {
  day: number;
  month: number;
}

export interface SolarTermDateRange {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export interface SolarTermEventDefinition extends SolarTermDateRange {
  id: string;
  title: string;
  targetLongitude: number;
  isImportant: boolean;
}

export interface YearlySolarTermEvent {
  id: string;
  title: string;
  type: 'solar';
  day: number;
  month: number;
  isImportant: boolean;
  isReadOnly: boolean;
  source: 'dynamic-yearly';
}

const JULIAN_DAY_UNIX_EPOCH = 2440587.5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEGREE_FULL_CIRCLE = 360;

export const SOLAR_TERM_EVENT_DEFINITIONS: SolarTermEventDefinition[] = [
  {
    id: 'dynamic-solar-term-lap-xuan',
    title: 'Tiết Lập Xuân',
    targetLongitude: 315,
    startMonth: 2,
    startDay: 3,
    endMonth: 2,
    endDay: 6,
    isImportant: true,
  },
  {
    id: 'dynamic-solar-term-ha-chi',
    title: 'Tiết Hạ Chí',
    targetLongitude: 90,
    startMonth: 6,
    startDay: 20,
    endMonth: 6,
    endDay: 23,
    isImportant: true,
  },
  {
    id: 'dynamic-solar-term-lap-thu',
    title: 'Tiết Lập Thu',
    targetLongitude: 135,
    startMonth: 8,
    startDay: 6,
    endMonth: 8,
    endDay: 9,
    isImportant: true,
  },
  {
    id: 'dynamic-solar-term-thu-phan',
    title: 'Tiết Thu Phân',
    targetLongitude: 180,
    startMonth: 9,
    startDay: 22,
    endMonth: 9,
    endDay: 24,
    isImportant: true,
  },
  {
    id: 'dynamic-solar-term-dong-chi',
    title: 'Tiết Đông Chí',
    targetLongitude: 270,
    startMonth: 12,
    startDay: 21,
    endMonth: 12,
    endDay: 23,
    isImportant: true,
  },
  {
    id: 'dynamic-solar-term-dai-han',
    title: 'Tiết Đại Hàn',
    targetLongitude: 300,
    startMonth: 1,
    startDay: 19,
    endMonth: 1,
    endDay: 22,
    isImportant: true,
  },
  {
    id: 'dynamic-solar-term-thanh-minh',
    title: 'Tiết Thanh Minh',
    targetLongitude: 15,
    startMonth: 4,
    startDay: 3,
    endMonth: 4,
    endDay: 6,
    isImportant: true,
  },
];

function toJulianDay(utcMillis: number) {
  return utcMillis / MS_PER_DAY + JULIAN_DAY_UNIX_EPOCH;
}

function normalizeDegrees(angle: number) {
  let normalized = angle % DEGREE_FULL_CIRCLE;
  if (normalized < 0) {
    normalized += DEGREE_FULL_CIRCLE;
  }
  return normalized;
}

function sunLongitudeDegrees(julianDay: number) {
  const t = (julianDay - 2451545.0) / 36525;
  const t2 = t * t;
  const dr = Math.PI / 180;
  const m = 357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
  const l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
  let dl = (1.914600 - 0.004817 * t - 0.000014 * t2) * Math.sin(dr * m);
  dl += (0.019993 - 0.000101 * t) * Math.sin(dr * 2 * m) + 0.000290 * Math.sin(dr * 3 * m);
  return normalizeDegrees(l0 + dl);
}

function solarLongitudeAtLocalMidnight(year: number, month: number, day: number, timeZone: number) {
  const utcMillis = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - timeZone * 60 * 60 * 1000;
  return sunLongitudeDegrees(toJulianDay(utcMillis));
}

function crossesTargetLongitude(startLongitude: number, endLongitude: number, targetLongitude: number) {
  if (startLongitude <= endLongitude) {
    return targetLongitude >= startLongitude && targetLongitude < endLongitude;
  }
  return targetLongitude >= startLongitude || targetLongitude < endLongitude;
}

function isValidYear(year: number) {
  return Number.isInteger(year) && year >= 1 && year <= 9999;
}

export function calculateSolarTermDate(
  year: number,
  targetLongitude: number,
  range: SolarTermDateRange,
  timeZone = 7,
): SolarTermDate | null {
  if (!isValidYear(year)) {
    throw new Error('Invalid year');
  }

  const startDate = new Date(year, range.startMonth - 1, range.startDay);
  const endDate = new Date(year, range.endMonth - 1, range.endDay);

  for (let current = new Date(startDate); current <= endDate; current.setDate(current.getDate() + 1)) {
    const month = current.getMonth() + 1;
    const day = current.getDate();
    const nextDate = new Date(current);
    nextDate.setDate(nextDate.getDate() + 1);

    const startLongitude = solarLongitudeAtLocalMidnight(year, month, day, timeZone);
    const endLongitude = solarLongitudeAtLocalMidnight(
      nextDate.getFullYear(),
      nextDate.getMonth() + 1,
      nextDate.getDate(),
      timeZone,
    );

    if (crossesTargetLongitude(startLongitude, endLongitude, normalizeDegrees(targetLongitude))) {
      return {
        day,
        month,
      };
    }
  }

  return null;
}

export function buildYearlySolarTermEvents(year: number, timeZone = 7): YearlySolarTermEvent[] {
  if (!isValidYear(year)) {
    throw new Error('Invalid year');
  }

  return SOLAR_TERM_EVENT_DEFINITIONS.map(definition => {
    const date = calculateSolarTermDate(year, definition.targetLongitude, definition, timeZone);
    if (!date) {
      throw new Error(`Unable to calculate solar term date for ${definition.id} in year ${year}`);
    }

    return {
      id: definition.id,
      title: definition.title,
      type: 'solar',
      day: date.day,
      month: date.month,
      isImportant: definition.isImportant,
      isReadOnly: true,
      source: 'dynamic-yearly',
    };
  });
}
