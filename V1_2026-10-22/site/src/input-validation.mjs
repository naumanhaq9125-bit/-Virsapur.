const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?$/;
const PERSON_NAME = /^[\p{L}\p{M}]+(?:[ .'’\-][\p{L}\p{M}]+)*\.?$/u;

export function isValidDateOnly(value) {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isValidDateTime(value) {
  if (typeof value !== 'string') return false;
  if (!DATE_TIME.test(value) || !isValidDateOnly(value.slice(0, 10))) return false;
  return Number.isFinite(Date.parse(value));
}

export function isValidPersonName(value) {
  return typeof value === 'string' && PERSON_NAME.test(value.trim());
}
