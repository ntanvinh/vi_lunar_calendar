import {describe, expect, test} from 'vitest';
import {twRgba} from '../src/TailwindUtil';

describe('twRgba', function() {
  test('blue-700, 70 should return corresponding rgba', function() {
    expect(twRgba('blue-700', 70)).toEqual('rgba(29,78,216,70)');
  });
});
