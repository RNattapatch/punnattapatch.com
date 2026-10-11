const RESERVED_IDS = new Set([...Object.getOwnPropertyNames(Object.prototype), '__proto__']);
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;

export function isSafeId(value) {
  return typeof value === 'string' && SAFE_ID.test(value) && !RESERVED_IDS.has(value);
}
