/** Tiny form-validation helpers used across modals and auth screens. */

export function required(value: string | null | undefined): boolean {
  return !!value && value.trim().length > 0;
}

export function minLength(value: string, n: number): boolean {
  return value.length >= n;
}

export function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/** Initials (max 2 chars, uppercased) for avatar bubbles. */
export function initials(name: string | null | undefined): string {
  return (name || 'G').slice(0, 2).toUpperCase();
}

/** First letter for single-letter avatars. */
export function firstLetter(name: string | null | undefined): string {
  return (name || '?')[0].toUpperCase();
}
