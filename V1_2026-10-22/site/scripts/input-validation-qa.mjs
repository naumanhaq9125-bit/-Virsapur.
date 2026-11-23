import assert from 'node:assert/strict';
import { isValidDateOnly, isValidDateTime, isValidPersonName } from '../src/input-validation.mjs';
import { validateCollection } from '../src/cms/validation.mjs';

const checks = [];
const check = (name, run) => { run(); checks.push(name); };

check('calendar dates reject impossible and non-date values', () => {
  assert.equal(isValidDateOnly('2024-02-29'), true);
  assert.equal(isValidDateOnly('2026-02-29'), false);
  assert.equal(isValidDateOnly('2026-13-01'), false);
  assert.equal(isValidDateOnly('2026-2-01'), false);
});

check('scheduled date-times reject invalid dates and clock values', () => {
  assert.equal(isValidDateTime('2026-11-25T18:18'), true);
  assert.equal(isValidDateTime('2026-11-25T18:18:00Z'), true);
  assert.equal(isValidDateTime('2026-02-31T18:18'), false);
  assert.equal(isValidDateTime('2026-11-25T25:18'), false);
  assert.equal(isValidDateTime('2026-11-25'), false);
});

check('account names allow international letters and reject punctuation-only names', () => {
  assert.equal(isValidPersonName('Hanan Javed'), true);
  assert.equal(isValidPersonName('O’Connor'), true);
  assert.equal(isValidPersonName('محمد علی'), true);
  assert.equal(isValidPersonName('---'), false);
  assert.equal(isValidPersonName('Name<script>'), false);
});

check('official trip content blocks invalid state, date and reversed schedule', () => {
  const base = { id: 'qa-trip', scheduleType: 'heritage-trip', registrationState: 'open', start: '2026-11-25T10:00', end: '2026-11-26T10:00', capacity: 12, officialTrip: {} };
  assert.deepEqual(validateCollection('events', [{ ...base, start: '2026-02-31T10:00' }]).some(error => error.includes('start must be a valid date and time')), true);
  assert.deepEqual(validateCollection('events', [{ ...base, registrationState: 'available-ish' }]).some(error => error.includes('invalid trip registration state')), true);
  assert.deepEqual(validateCollection('events', [{ ...base, end: '2026-11-24T10:00' }]).some(error => error.includes('trip end must be after trip start')), true);
  assert.deepEqual(validateCollection('events', [{ ...base, status: 'draft', start: '', end: '' }]), []);
});

console.log(JSON.stringify({ ok: true, checks: checks.length, passed: checks }, null, 2));
