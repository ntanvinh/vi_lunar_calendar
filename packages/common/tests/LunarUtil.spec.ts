import {describe, expect, test} from 'vitest';
import {convertLunar2Solar, convertSolar2Lunar, toLunarDate, toSolarDate} from '../src/LunarUtil';

describe('convertSolar2Lunar', function() {
  test('Given 2013-05-04 in Julian get 2013-03-25 in Lunar calendar with not leap year', () => {
    const res = convertSolar2Lunar(4, 5, 2013, 1);
    expect(res).toEqual([25, 3, 2013, 0]);
  });
});
describe('toLunarDate', function() {
  test('Given 2013-05-04 in Julian get 2013-03-25 in Lunar calendar with not leap year', () => {
    const {lunarDay, lunarMonth, lunarYear, isLunarLeap} = toLunarDate(new Date('2013-05-04'), 1);
    expect(lunarDay).toEqual(25);
    expect(lunarMonth).toEqual(3);
    expect(lunarYear).toEqual(2013);
    expect(isLunarLeap).toEqual(false);
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
    const res = toSolarDate({lunarDay: 21, lunarMonth: 1, lunarYear: 2013, isLunarLeap: false}, 1);
    expect(res.getDate()).toEqual(2);
    expect(res.getMonth() + 1).toEqual(3);
    expect(res.getFullYear()).toEqual(2013);
  });
});
