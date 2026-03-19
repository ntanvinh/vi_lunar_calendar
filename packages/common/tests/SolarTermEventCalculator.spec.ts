import {describe, expect, test} from 'vitest';
import {
  buildYearlySolarTermEvents,
  calculateSolarTermDate,
  SOLAR_TERM_EVENT_DEFINITIONS,
  type YearlySolarTermEvent,
} from '../src/SolarTermEventCalculator.ts';

describe('buildYearlySolarTermEvents', () => {
  test('returns yearly solar-term events with expected date ranges', () => {
    const events = buildYearlySolarTermEvents(2026, 7);
    expect(events).toHaveLength(7);

    const expectedRanges: Record<string, {month: number; days: number[]}> = {
      'dynamic-solar-term-lap-xuan': {month: 2, days: [4, 5]},
      'dynamic-solar-term-ha-chi': {month: 6, days: [21, 22]},
      'dynamic-solar-term-lap-thu': {month: 8, days: [7, 8]},
      'dynamic-solar-term-thu-phan': {month: 9, days: [22, 23]},
      'dynamic-solar-term-dong-chi': {month: 12, days: [21, 22]},
      'dynamic-solar-term-dai-han': {month: 1, days: [20, 21]},
      'dynamic-solar-term-thanh-minh': {month: 4, days: [4, 5]},
    };

    Object.entries(expectedRanges).forEach(([id, range]) => {
      const event = events.find((item: YearlySolarTermEvent) => item.id === id);
      expect(event).toBeTruthy();
      expect(event?.month).toBe(range.month);
      expect(range.days).toContain(event?.day as number);
      expect(event?.isReadOnly).toBeTruthy();
      expect(event?.source).toBe('dynamic-yearly');
    });
  });

  test('supports leap years', () => {
    const events = buildYearlySolarTermEvents(2024, 7);
    expect(events.every((event: YearlySolarTermEvent) => event.day > 0 && event.month > 0)).toBeTruthy();
  });

  test('throws when year is invalid', () => {
    expect(() => buildYearlySolarTermEvents(0, 7)).toThrowError();
    expect(() => buildYearlySolarTermEvents(Number.NaN, 7)).toThrowError();
  });
});

describe('calculateSolarTermDate', () => {
  test('returns null when search range does not contain target longitude', () => {
    const definition = SOLAR_TERM_EVENT_DEFINITIONS[0];
    const date = calculateSolarTermDate(2026, definition.targetLongitude, {
      startMonth: 1,
      startDay: 1,
      endMonth: 1,
      endDay: 2,
    }, 7);

    expect(date).toBeNull();
  });
});
