// Emoji icon per canonical category. Emoji are effectively standardised glyphs —
// zero copyright risk, consistent on modern devices, and instant. (Can be swapped
// for branded SVGs later without touching callers — they just read this map.)
import type { Category } from './categories.ts';

export const CATEGORY_ICON: Record<Category, string> = {
  Agriculture: '🌾',
  Education: '🎓',
  Scholarship: '🏅',
  Health: '🏥',
  Insurance: '🛡️',
  Pension: '👵',
  Loan: '💰',
  Housing: '🏠',
  Employment: '💼',
  'Skill Development': '🛠️',
  'Financial Assistance': '💸',
  'Women & Child': '👩‍👧',
  'Social Welfare': '🤝',
  'Business & Startup': '🚀',
  Disability: '♿',
  'Utility & Energy': '💡',
};

export function iconFor(category: string): string {
  return CATEGORY_ICON[category as Category] ?? '📋';
}
