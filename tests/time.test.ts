import {test} from 'vitest';
import assert from 'node:assert/strict';
import {today} from '../src/domain/dates.ts';

test('today is the Florida date, even after UTC has rolled over',()=>{
  assert.equal(today(new Date('2026-11-06T04:30:00Z')),'2026-11-05');
  assert.equal(today(new Date('2026-11-06T05:00:00Z')),'2026-11-06');
  assert.equal(today(new Date('2026-07-01T03:59:00Z')),'2026-06-30');
});
