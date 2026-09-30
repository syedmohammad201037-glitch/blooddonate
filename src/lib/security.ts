/**
 * Security utilities: input validation, sanitization, XSS escaping, CSV formula injection protection.
 */

// Allowed blood groups
export const ALLOWED_BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'
] as const;

export type BloodGroup = typeof ALLOWED_BLOOD_GROUPS[number];

/**
 * Validates and normalizes Pakistani CNIC (NADRA format).
 * Raw input can be with or without dashes: 42101-1234567-1 or 4210112345671.
 * Returns formatted 15-character string "42101-XXXXXXX-X" or null if invalid.
 */
export function validateAndFormatCnic(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');
  if (digits.length !== 13) return null;

  // Pakistani CNIC first digit is between 1 and 7
  const firstDigit = parseInt(digits[0], 10);
  if (isNaN(firstDigit) || firstDigit < 1 || firstDigit > 7) {
    return null;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

/**
 * Validates and normalizes Pakistani mobile numbers.
 * Supports: 03001234567, 0300-1234567, +923001234567, 00923001234567.
 * Returns standard format "03XX-XXXXXXX" or null if invalid.
 */
export function validateAndFormatPhone(input: string): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, '');

  // Handle +92 or 92 prefix
  if (digits.startsWith('923') && digits.length === 12) {
    digits = '0' + digits.slice(2);
  } else if (digits.startsWith('00923') && digits.length === 14) {
    digits = '0' + digits.slice(4);
  }

  // Accept 10-digit numbers typed without the leading 0 (e.g. 3001234567)
  if (digits.length === 10 && digits.startsWith('3')) {
    digits = '0' + digits;
  }

  // Must be 11 digits starting with 03 -> always stored as 0300-1234567
  if (digits.length === 11 && digits.startsWith('03')) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return null;
}

/**
 * Live input formatter: turns whatever the user types/pastes into 0300-1234567 pattern.
 * Handles +92 / 0092 prefixes, strips letters/spaces, caps at 11 digits.
 */
export function formatPhoneInput(input: string): string {
  let digits = (input || '').replace(/\D/g, '');
  if (digits.startsWith('0092')) digits = '0' + digits.slice(4);
  else if (digits.startsWith('92') && digits.length >= 12) digits = '0' + digits.slice(2);
  digits = digits.slice(0, 11);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
}

/**
 * Pretty-formats a normalized phone number: 0300-1234567
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return phone;
}

/**
 * Validates blood group against allowed allowlist
 */
export function isValidBloodGroup(bg: string): bg is BloodGroup {
  return (ALLOWED_BLOOD_GROUPS as readonly string[]).includes(bg);
}

/**
 * HTML escape to prevent XSS in print/export strings
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes CSV cell values to prevent CSV Formula Injection (CSV Injection / CWE-1236).
 * Prepends a single quote if the value starts with dangerous characters (=, +, -, @, tab, cr).
 */
export function sanitizeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();

  // If value starts with formula triggers, escape it
  const formulaChars = ['=', '+', '-', '@', '\t', '\r'];
  if (formulaChars.some(char => str.startsWith(char))) {
    str = `'${str}`;
  }

  // Escape inner quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Masks a full name for public token tracking (e.g. "Muhammad Usman" -> "M******* U****")
 */
export function maskName(name: string): string {
  if (!name) return 'Donor';
  return name
    .trim()
    .split(/\s+/)
    .map(word => {
      if (word.length <= 1) return word;
      return word[0] + '*'.repeat(Math.min(word.length - 1, 6));
    })
    .join(' ');
}

/**
 * Generates a clean, user-friendly 4-digit numeric token number (e.g. BDC-1001, BDC-1002, BDC-1234).
 * If a list of existing tokens is provided, it increments sequentially from 1001.
 * Otherwise, generates a random 4-digit number between 1001 and 9999.
 */
export function generateCollisionSafeToken(existingTokens?: string[]): string {
  if (existingTokens && existingTokens.length > 0) {
    let maxNum = 1000;
    for (const t of existingTokens) {
      const match = (t || '').match(/BDC-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    return `BDC-${maxNum + 1}`;
  }

  // 4-digit random number between 1001 and 9999
  const random4 = Math.floor(1001 + Math.random() * 8998);
  return `BDC-${random4}`;
}