import {describe, expect, test} from 'vitest';
import {convertLunar2Solar, convertSolar2Lunar, isLunarLeapYear, toLunarDate, toSolarDate} from '../src/LunarUtil';

describe('isLunarLeapYear', function() {
  test('2022 not is leap year', function() {
    expect(isLunarLeapYear(2022)).toBeFalsy();
  });
  test('2023 is leap year', function() {
    expect(isLunarLeapYear(2023)).toBeTruthy();
  });
});
describe('convertSolar2Lunar', function() {
  test('Given 2013-05-04 in Julian get 2013-03-25 in Lunar calendar with not leap year', () => {
    const res = convertSolar2Lunar(4, 5, 2013, 1);
    expect(res).toEqual([25, 3, 2013, 0]);
  });
});
describe('toLunarDate', function() {
  test('Given 2013-05-04 in Julian get 2013-03-25 in Lunar calendar with not leap year', () => {
    const {lunarDay, lunarMonth, lunarYear, isLeapMonth} = toLunarDate(new Date('2013-05-04'), 1);
    expect(lunarDay).toEqual(25);
    expect(lunarMonth).toEqual(3);
    expect(lunarYear).toEqual(2013);
    expect(isLeapMonth).toEqual(false);
  });
});
describe('convertLunar2Solar', function() {
  test('Given 2013-01-21 in Lunar get 2013-03-02 in Julian calendar', () => {
    const res = convertLunar2Solar(21, 1, 2013, 0, 1);
    expect(res).toEqual([2, 3, 2013]);
  });
});
describe('toSolarDate', function() {
  test('Given 2013-01-21 in Lunar get 2013-03-02 in Julian calendar', () => {
    const res = toSolarDate({lunarDay: 21, lunarMonth: 1, lunarYear: 2013, isLeapMonth: false}, 1);
    expect(res.getDate()).toEqual(2);
    expect(res.getMonth() + 1).toEqual(3);
    expect(res.getFullYear()).toEqual(2013);
  });
});
