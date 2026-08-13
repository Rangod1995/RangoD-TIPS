export function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function normalize(value, max) {
  if (max <= 0) return 0;
  return clamp(value / max);
}

export function inverseNormalize(value, max) {
  if (max <= 0) return 0;
  return clamp((max - value) / max);
}

export function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function average(...values) {
  const valid = values.filter((v) => Number.isFinite(v));

  if (!valid.length) return 0;

  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}