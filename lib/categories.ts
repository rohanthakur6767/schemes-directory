// ---------------------------------------------------------------------------
// Controlled category vocabulary (D30 fix). Categories are an SEO surface (hub
// pages), so they must be a fixed, search-friendly set — not free-text the LLM
// invents. Pure module → unit-tested; used by the normalizer, the importer, the
// parse prompt, and the review-tool picker (one source of truth).
// ---------------------------------------------------------------------------

// ~16 canonical categories chosen for what people actually search in this niche.
export const CANONICAL_CATEGORIES = [
  'Agriculture',
  'Education',
  'Scholarship',
  'Health',
  'Insurance',
  'Pension',
  'Loan',
  'Housing',
  'Employment',
  'Skill Development',
  'Financial Assistance',
  'Women & Child',
  'Social Welfare',
  'Business & Startup',
  'Disability',
  'Utility & Energy',
] as const;

export type Category = (typeof CANONICAL_CATEGORIES)[number];

const ORDER = new Map(CANONICAL_CATEGORIES.map((c, i) => [c, i]));

// Map drifted / raw labels (lowercased) → a canonical category.
const MAP: Record<string, Category> = {
  // Agriculture
  agriculture: 'Agriculture', 'agricultural inputs': 'Agriculture', farmer: 'Agriculture',
  farmers: 'Agriculture', 'rural & environment': 'Agriculture',
  // Education / research / tech-education
  education: 'Education', 'education & learning': 'Education', 'technical education': 'Education',
  technology: 'Education', innovation: 'Education', research: 'Education', infrastructure: 'Education',
  'science, it & communications': 'Education',
  // Scholarship
  scholarship: 'Scholarship', scholarships: 'Scholarship',
  // Health
  health: 'Health', 'health & wellness': 'Health', medical: 'Health',
  // Insurance
  insurance: 'Insurance',
  // Pension
  pension: 'Pension',
  // Loan / credit
  loan: 'Loan', loans: 'Loan', 'loan-subsidy': 'Loan', 'loan subsidy': 'Loan', credit: 'Loan',
  // Housing
  housing: 'Housing', shelter: 'Housing', 'housing & shelter': 'Housing',
  // Employment / livelihood
  employment: 'Employment', livelihood: 'Employment', 'skills & employment': 'Employment',
  // Skill Development
  skills: 'Skill Development', skill: 'Skill Development', 'skill development': 'Skill Development',
  training: 'Skill Development',
  // Financial Assistance (cash support, subsidies, savings)
  'income support': 'Financial Assistance', 'financial security': 'Financial Assistance',
  'financial assistance': 'Financial Assistance', savings: 'Financial Assistance',
  subsidy: 'Financial Assistance', 'banking, financial services and insurance': 'Financial Assistance',
  // Women & Child
  'women & child': 'Women & Child', 'women and child': 'Women & Child', 'women & children': 'Women & Child',
  child: 'Women & Child', women: 'Women & Child',
  // Social Welfare / empowerment / caste categories
  'social welfare': 'Social Welfare', 'social security': 'Social Welfare', welfare: 'Social Welfare',
  'scheduled caste': 'Social Welfare', 'scheduled tribe': 'Social Welfare', sc: 'Social Welfare',
  st: 'Social Welfare', obc: 'Social Welfare', minority: 'Social Welfare',
  'social welfare & empowerment': 'Social Welfare',
  // Business & Startup
  'business & startup': 'Business & Startup', business: 'Business & Startup', startup: 'Business & Startup',
  entrepreneur: 'Business & Startup', entrepreneurship: 'Business & Startup', msme: 'Business & Startup',
  'business & entrepreneurship': 'Business & Startup',
  // Disability
  disability: 'Disability', disabled: 'Disability', divyang: 'Disability',
  // Utility & Energy
  energy: 'Utility & Energy', utility: 'Utility & Energy', sanitation: 'Utility & Energy',
  water: 'Utility & Energy', 'utility & sanitation': 'Utility & Energy', electricity: 'Utility & Energy',
};

// Self-map the canonical labels too (so already-clean input passes through).
for (const c of CANONICAL_CATEGORIES) MAP[c.toLowerCase()] = c;

// Map raw labels → canonical set (deduped, in canonical order). Anything we
// can't map is returned in `unmapped` — reported, never silently dropped.
export function normalizeCategories(raw: string[]): { canonical: Category[]; unmapped: string[] } {
  const set = new Set<Category>();
  const unmapped: string[] = [];
  for (const r of raw) {
    const hit = MAP[r.trim().toLowerCase()];
    if (hit) set.add(hit);
    else unmapped.push(r);
  }
  const canonical = [...set].sort((a, b) => ORDER.get(a)! - ORDER.get(b)!);
  return { canonical, unmapped };
}
