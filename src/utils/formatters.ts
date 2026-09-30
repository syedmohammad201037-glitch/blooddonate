/**
 * Utility functions for strict formatting of CNIC, Phone, Dates, and Badges
 */

/**
 * Normalizes and formats Pakistani CNIC into standard XXXXX-XXXXXXX-X format
 * (5 digits - 7 digits - 1 digit)
 */
export function formatCNIC(value: string | undefined | null): string {
  if (!value) return '';
  const digits = value.toString().replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) {
    return digits;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}

/**
 * Validates if the CNIC has complete 13 digits
 */
export function isValidCNIC(value: string | undefined | null): boolean {
  if (!value) return false;
  const digits = value.toString().replace(/\D/g, '');
  return digits.length === 13;
}

/**
 * Formats Pakistani mobile numbers to 03XX-XXXXXXX format
 * Handles numbers starting with 03..., 923..., +923..., 3...
 */
export function formatPhone(value: string | undefined | null): string {
  if (!value) return '';
  let digits = value.toString().replace(/\D/g, '');
  
  // If user entered +92 or 92 at beginning, convert to 0
  if (digits.startsWith('923')) {
    digits = '0' + digits.slice(2);
  } else if (digits.length === 10 && digits.startsWith('3')) {
    digits = '0' + digits;
  }

  // Cap at 11 digits
  digits = digits.slice(0, 11);

  if (digits.length <= 4) {
    return digits;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
}

/**
 * Validates if the phone number has complete 11 digits starting with 03
 */
export function isValidPhone(value: string | undefined | null): boolean {
  if (!value) return false;
  const formatted = formatPhone(value);
  const digits = formatted.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('03');
}

/**
 * Formats raw date strings (YYYY-MM-DD or ISO) into readable English format
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return 'Not recorded';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Generates WhatsApp click-to-chat URL with standard message
 */
export function getWhatsAppUrl(phone: string, donorName: string, bloodGroup: string): string {
  const digits = phone.replace(/\D/g, '');
  // Format for WhatsApp: international format 923XXXXXXXXX
  let intlPhone = digits;
  if (digits.startsWith('03')) {
    intlPhone = '92' + digits.slice(1);
  }
  const text = encodeURIComponent(
    `Assalam-o-Alaikum ${donorName},\nRegarding blood donation (${bloodGroup}) through Hayat Blood Network.`
  );
  return `https://wa.me/${intlPhone}?text=${text}`;
}
