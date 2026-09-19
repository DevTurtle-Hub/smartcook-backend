/**
 * Utility for normalizing Vietnamese text
 * Strips diacritics / accents and trims for resilient search matching
 */
export function normalizeVietnamese(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim();
}
