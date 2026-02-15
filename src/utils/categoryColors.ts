/**
 * Deterministic colorful badge palette for category labels.
 * Given the same label string the returned colour pair is always the same.
 */

interface BadgeColors {
  color: string;
  background: string;
}

const CATEGORY_PALETTE: BadgeColors[] = [
  { color: '#e11d48', background: 'rgba(225, 29, 72, 0.15)' },   // rose
  { color: '#7c3aed', background: 'rgba(124, 58, 237, 0.15)' },  // violet
  { color: '#2563eb', background: 'rgba(37, 99, 235, 0.15)' },   // blue
  { color: '#0891b2', background: 'rgba(8, 145, 178, 0.15)' },   // cyan
  { color: '#059669', background: 'rgba(5, 150, 105, 0.15)' },   // emerald
  { color: '#d97706', background: 'rgba(217, 119, 6, 0.15)' },   // amber
  { color: '#dc2626', background: 'rgba(220, 38, 38, 0.15)' },   // red
  { color: '#4f46e5', background: 'rgba(79, 70, 229, 0.15)' },   // indigo
  { color: '#0d9488', background: 'rgba(13, 148, 136, 0.15)' },  // teal
  { color: '#c026d3', background: 'rgba(192, 38, 211, 0.15)' },  // fuchsia
  { color: '#ea580c', background: 'rgba(234, 88, 12, 0.15)' },   // orange
  { color: '#16a34a', background: 'rgba(22, 163, 74, 0.15)' },   // green
];

/**
 * Simple, stable hash of a string into a number.
 */
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Returns a deterministic colour pair for a given category label.
 */
export const getCategoryBadgeColors = (label: string): BadgeColors => {
  const normalised = label.trim().toLowerCase();
  if (!normalised) {
    return { color: 'rgba(244, 244, 245, 0.8)', background: 'rgba(255, 255, 255, 0.08)' };
  }
  const index = hashString(normalised) % CATEGORY_PALETTE.length;
  return CATEGORY_PALETTE[index];
};
