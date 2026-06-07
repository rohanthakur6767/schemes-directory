// ---------------------------------------------------------------------------
// Phase 1 seed: 10 real schemes, hand-entered. 8 central + 2 state (MP, WB).
//
// PROVENANCE: structured facts compiled from official portals and checked
// against live web sources on 2026-06-02 (Ladli Behna ₹1,500; SVANidhi
// restructured tranches 15k/25k/50k, extended to 2030; Kanyashree income
// ceiling removed; PM-JAY 70+ Vay Vandana confirmed). All prose is ORIGINAL —
// written for this site, not copied from any source (PLAN §2).
//
// last_verified is null on every record: the OWNER verifies each scheme
// against its official portal and stamps the date. Until then, pages render
// a "facts pending verification" notice.
//
// OWNER-CHECK flags (could not be confirmed on an official page today):
//   - Kanyashree: K1 annual amount asserted as ₹1,000 (one source claimed ₹750)
//   - Ujjwala: refill-subsidy cap per year (9 vs 12) — prose avoids the number
//   - Ladli Behna: whether NEW registrations are currently open
// ---------------------------------------------------------------------------
import type { Benefit, Eligibility, Prose } from '../lib/types.ts';

export type SeedScheme = {
  id: string;
  slug: string;
  name: string;
  level: 'central' | 'state';
  state: string | null;
  categories: string[];
  benefit: Benefit;
  eligibility: Eligibility;
  documents: string[];
  official_url: string;
  source: string;
  last_verified: string | null;
  en: Prose;
};

export const SEED_SCHEMES: SeedScheme[] = [
  {
    id: 'pm-kisan',
    slug: 'pm-kisan',
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    level: 'central',
    state: null,
    categories: ['Agriculture', 'Income Support'],
    benefit: {
      type: 'cash',
      amount: 6000,
      frequency: 'yearly',
      note: 'Three instalments of ₹2,000 every four months, via DBT',
    },
    eligibility: {
      occupation: ['farmer'],
      other_flags: ['owns_cultivable_land', 'not_income_tax_payer'],
    },
    documents: ['Aadhaar card', 'Bank passbook', 'Land ownership records (khasra/khatauni)'],
    official_url: 'https://pmkisan.gov.in/',
    source: 'PM-KISAN portal (pmkisan.gov.in), Ministry of Agriculture & Farmers Welfare',
    last_verified: null,
    en: {
      name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      summary:
        'Income support of ₹6,000 per year for landholding farmer families, paid in three instalments of ₹2,000 directly into bank accounts.',
      eligibility_prose:
        'Every landholding farmer family qualifies — a family here means husband, wife and minor children who together own cultivable land. The scheme excludes better-off households: anyone in the family who pays income tax, serves or has retired as a government employee, draws a pension of ₹10,000 or more a month, holds or has held a constitutional post, or practises a profession such as medicine, law, engineering or accountancy.',
      benefits_prose:
        'The family receives ₹6,000 every year as direct income support, transferred in three equal instalments of ₹2,000 once every four months. The money goes straight to the registered bank account through the Direct Benefit Transfer system — no intermediaries at disbursal.',
      how_to_apply:
        "Register online at pmkisan.gov.in under Farmers' Corner → New Farmer Registration, or visit the nearest Common Service Centre with your Aadhaar, bank passbook and land records. Aadhaar-based eKYC is mandatory — it can be completed on the portal with an OTP — and instalment status can be tracked there too.",
    },
  },
  {
    id: 'ayushman-bharat-pm-jay',
    slug: 'ayushman-bharat-pm-jay',
    name: 'Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    level: 'central',
    state: null,
    categories: ['Health', 'Insurance'],
    benefit: {
      type: 'insurance',
      amount: 500000,
      frequency: 'yearly',
      note: 'Health cover of ₹5 lakh per family per year for hospitalisation',
    },
    eligibility: {
      other_flags: ['secc_2011_listed_or_age_70_plus'],
    },
    documents: ['Aadhaar card', 'Ration card or family ID'],
    official_url: 'https://pmjay.gov.in/',
    source: 'National Health Authority (pmjay.gov.in)',
    last_verified: null,
    en: {
      name: 'Ayushman Bharat PM-JAY',
      summary:
        'Free, cashless health cover of ₹5 lakh per family per year at empanelled hospitals, for poor and vulnerable families — and for all citizens aged 70+.',
      eligibility_prose:
        'Eligibility is family-based, not income-certificate-based: rural families matching the SECC 2011 deprivation criteria and urban families in listed occupational categories are covered automatically, with no cap on family size or age. Since October 2024, every citizen aged 70 or above also qualifies under the Ayushman Vay Vandana card, regardless of income — as a separate ₹5 lakh top-up if the family already holds PM-JAY cover. The quickest way to know is to check your name on the official beneficiary portal or call 14555.',
      benefits_prose:
        'Each covered family gets health insurance worth ₹5 lakh per year for secondary and tertiary hospitalisation. Treatment is cashless and paperless at any empanelled hospital — public or private — anywhere in India, and pre-existing conditions are covered from day one.',
      how_to_apply:
        'Check whether your family is listed at beneficiary.nha.gov.in or call the 14555 helpline. If listed, complete eKYC and download the Ayushman card from the portal or the Ayushman app, or have it made free of charge at any empanelled hospital or Common Service Centre.',
    },
  },
  {
    id: 'pm-ujjwala-yojana',
    slug: 'pm-ujjwala-yojana',
    name: 'Pradhan Mantri Ujjwala Yojana (PMUY)',
    level: 'central',
    state: null,
    categories: ['Women & Child', 'Energy'],
    benefit: {
      type: 'subsidy',
      amount: null,
      frequency: null,
      note: 'Free LPG connection with first refill and stove; ₹300 subsidy per cylinder refill via DBT',
    },
    eligibility: {
      gender: 'female',
      age_min: 18,
      other_flags: ['poor_household', 'no_lpg_connection_in_household'],
    },
    documents: [
      'Aadhaar card',
      'Bank account details',
      'Address proof',
      'Priority-category proof or self-declaration of poor household',
    ],
    official_url: 'https://www.pmuy.gov.in/',
    source: 'PMUY portal (pmuy.gov.in), Ministry of Petroleum & Natural Gas',
    last_verified: null,
    en: {
      name: 'PM Ujjwala Yojana (PMUY)',
      summary:
        'Free LPG connection — no deposit, free first refill and stove — for adult women from poor households, plus a ₹300-per-cylinder refill subsidy.',
      eligibility_prose:
        'Applications are open to adult women (18+) from poor households that do not already have an LPG connection in any member’s name. Priority categories include SC/ST households, PMAY (Gramin) and Antyodaya beneficiaries, tea-garden and forest-dwelling communities, and families on the SECC 2011 list — but any poor household can also qualify by submitting a simple self-declaration.',
      benefits_prose:
        'The connection comes entirely free: no security deposit, plus a free first refill and a free stove. Beneficiaries also receive a targeted subsidy of ₹300 per 14.2-kg cylinder, credited directly to the bank account, for a capped number of refills each year (the cap is set in the annual government notification).',
      how_to_apply:
        'Apply online at pmuy.gov.in by choosing your preferred LPG company — Indane, Bharatgas or HP Gas — or submit the form directly at the nearest distributor. You will need Aadhaar, a bank account and address proof; the distributor completes verification and installs the connection.',
    },
  },
  {
    id: 'atal-pension-yojana',
    slug: 'atal-pension-yojana',
    name: 'Atal Pension Yojana (APY)',
    level: 'central',
    state: null,
    categories: ['Pension', 'Financial Security'],
    benefit: {
      type: 'pension',
      amount: null,
      frequency: 'monthly',
      note: 'Guaranteed pension of ₹1,000–₹5,000 per month from age 60, by chosen contribution slab',
    },
    eligibility: {
      age_min: 18,
      age_max: 40,
      other_flags: ['has_savings_bank_account', 'not_income_tax_payer'],
    },
    documents: ['Aadhaar card', 'Savings bank or post office account details', 'Mobile number'],
    official_url: 'https://www.jansuraksha.gov.in/',
    source: 'Jansuraksha portal (jansuraksha.gov.in), Ministry of Finance / PFRDA',
    last_verified: null,
    en: {
      name: 'Atal Pension Yojana (APY)',
      summary:
        'Government-guaranteed pension of ₹1,000–₹5,000 per month from age 60, for unorganised-sector workers who join between ages 18 and 40.',
      eligibility_prose:
        'Any Indian citizen aged 18 to 40 with a savings bank or post-office account can enrol. The one hard exclusion: anyone who is or has been an income-tax payer cannot join — a rule in force since 1 October 2022. The earlier you join, the smaller the monthly contribution needed for the same pension.',
      benefits_prose:
        'You choose a guaranteed pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000 or ₹5,000 per month, payable from age 60 for life. After the subscriber’s death the spouse continues to receive the same pension, and the accumulated corpus then passes to the nominee. The guarantee is backed by the Government of India.',
      how_to_apply:
        'Enrol through the bank or post office where you hold your savings account — most banks accept APY registration through net banking or their mobile app in a few minutes. Contributions auto-debit monthly, quarterly or half-yearly, so the account only needs sufficient balance.',
    },
  },
  {
    id: 'sukanya-samriddhi-yojana',
    slug: 'sukanya-samriddhi-yojana',
    name: 'Sukanya Samriddhi Yojana (SSY)',
    level: 'central',
    state: null,
    categories: ['Women & Child', 'Savings'],
    benefit: {
      type: 'savings',
      amount: null,
      frequency: null,
      note: 'High-interest, fully tax-free savings account for a girl child; rate set quarterly by the government',
    },
    eligibility: {
      gender: 'female',
      age_max: 9,
    },
    documents: [
      "Girl child's birth certificate",
      "Guardian's ID and address proof",
      'Passport-size photograph',
    ],
    official_url: 'https://www.indiapost.gov.in/',
    source: 'India Post (indiapost.gov.in), Ministry of Finance — National Savings Institute',
    last_verified: null,
    en: {
      name: 'Sukanya Samriddhi Yojana (SSY)',
      summary:
        'A high-interest, fully tax-free government savings account for a girl child below 10, with deposits of ₹250 to ₹1.5 lakh per year.',
      eligibility_prose:
        'A parent or legal guardian can open one account in the name of a girl child below 10 years of age. Each girl can have only one account, and a family can open accounts for at most two daughters — twins or triplets being the exception.',
      benefits_prose:
        'Deposits earn one of the highest interest rates among government small-savings schemes, compounded annually and revised every quarter. You can invest ₹250 to ₹1.5 lakh per year; deposits qualify for the Section 80C deduction, and both the interest and the maturity amount are completely tax-free. The account matures 21 years after opening, with partial withdrawal allowed for higher education once the girl turns 18.',
      how_to_apply:
        "Open the account at any post office or authorised bank branch with the girl's birth certificate, the guardian's ID and address proof, and a minimum deposit of ₹250. Many banks also allow opening and topping up the account through net banking.",
    },
  },
  {
    id: 'pm-svanidhi',
    slug: 'pm-svanidhi',
    name: "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
    level: 'central',
    state: null,
    categories: ['Livelihood', 'Loans'],
    benefit: {
      type: 'loan',
      amount: 15000,
      frequency: 'one_time',
      note: 'First tranche ₹15,000; repeat tranches of ₹25,000 and ₹50,000 on timely repayment; 7% interest subsidy. Extended to March 2030.',
    },
    eligibility: {
      occupation: ['street_vendor'],
      other_flags: ['has_vending_certificate_or_survey_listing'],
    },
    documents: [
      'Aadhaar (linked to mobile number)',
      'Certificate of Vending / survey reference, or ULB recommendation letter',
      'Bank account details',
    ],
    official_url: 'https://pmsvanidhi.mohua.gov.in/',
    source: 'PM SVANidhi portal (pmsvanidhi.mohua.gov.in), Ministry of Housing & Urban Affairs',
    last_verified: null,
    en: {
      name: 'PM SVANidhi',
      summary:
        'Collateral-free working-capital loans for street vendors in rising tranches of ₹15,000, ₹25,000 and ₹50,000, with a 7% interest subsidy.',
      eligibility_prose:
        'Street vendors operating in urban areas qualify. You need either a Certificate of Vending or identity card issued by the urban local body, or to appear in the municipal vending survey; vendors left out of the survey can still apply with a letter of recommendation from the ULB or the Town Vending Committee. The scheme was restructured in August 2025 and extended to March 2030, with coverage widened to bring in new vendors.',
      benefits_prose:
        'The scheme offers collateral-free working-capital loans in rising tranches — ₹15,000 first, then ₹25,000, then ₹50,000 — each unlocked by timely repayment of the previous one. Borrowers earn a 7% annual interest subsidy credited quarterly, plus cashback incentives for accepting digital payments.',
      how_to_apply:
        'Apply at pmsvanidhi.mohua.gov.in or through any Common Service Centre. You will need Aadhaar linked to a mobile number and your vending certificate or survey reference; the portal routes the application to lending institutions, and sanction status can be tracked online.',
    },
  },
  {
    id: 'nmms-scholarship',
    slug: 'nmms-scholarship',
    name: 'National Means-cum-Merit Scholarship Scheme (NMMSS)',
    level: 'central',
    state: null,
    categories: ['Education', 'Scholarship'],
    benefit: {
      type: 'scholarship',
      amount: 12000,
      frequency: 'yearly',
      note: 'For four years, classes 9 to 12',
    },
    eligibility: {
      occupation: ['student'],
      income_max: 350000,
      other_flags: ['studying_in_government_or_aided_school'],
    },
    documents: [
      'Income certificate',
      'Caste certificate (if applicable)',
      'Bank account in the student’s name',
      'Aadhaar card',
      'Previous class marksheet',
    ],
    official_url: 'https://scholarships.gov.in/',
    source:
      'National Scholarship Portal (scholarships.gov.in), Department of School Education & Literacy',
    last_verified: null,
    en: {
      name: 'National Means-cum-Merit Scholarship (NMMSS)',
      summary:
        'A scholarship of ₹12,000 per year for classes 9–12, for bright students from families earning under ₹3.5 lakh, selected through a class-8 exam.',
      eligibility_prose:
        'The scholarship targets bright students from low-income families: parental income must not exceed ₹3.5 lakh a year, and the student must be studying in class 8 at a government, government-aided or local-body school (private schools and central schools such as KVs and JNVs are excluded). Selection is through a state-conducted exam, and appearing requires at least 55% marks in class 7 — relaxed to 50% for SC/ST students.',
      benefits_prose:
        'Selected students receive ₹12,000 per year — ₹1,000 a month — for four years covering classes 9 through 12, paid directly into the student’s own bank account. Continuation requires passing classes 9 and 11 in the first attempt and meeting minimum marks in class 10.',
      how_to_apply:
        "Apply for the state selection test through your school when your state's education department issues the annual notification, usually during class 8. After selection, register on the National Scholarship Portal (scholarships.gov.in) with bank, Aadhaar and income-certificate details, and renew the application each year.",
    },
  },
  {
    id: 'pm-vishwakarma',
    slug: 'pm-vishwakarma',
    name: 'PM Vishwakarma',
    level: 'central',
    state: null,
    categories: ['Livelihood', 'Skills'],
    benefit: {
      type: 'service',
      amount: null,
      frequency: null,
      note: '₹15,000 toolkit incentive, ₹500/day training stipend, collateral-free loans up to ₹3 lakh at 5%',
    },
    eligibility: {
      age_min: 18,
      occupation: ['artisan'],
      other_flags: ['works_in_listed_traditional_trade', 'no_family_member_in_government_service'],
    },
    documents: ['Aadhaar card', 'Mobile number', 'Bank account details', 'Ration card'],
    official_url: 'https://pmvishwakarma.gov.in/',
    source: 'PM Vishwakarma portal (pmvishwakarma.gov.in), Ministry of MSME',
    last_verified: null,
    en: {
      name: 'PM Vishwakarma',
      summary:
        'Recognition, training with a ₹500/day stipend, a ₹15,000 toolkit incentive and loans up to ₹3 lakh at 5% for artisans in 18 traditional trades.',
      eligibility_prose:
        'Open to artisans and craftspeople aged 18 or above who work with their hands in one of 18 listed traditional trades — carpenters, blacksmiths, potters, cobblers, tailors, goldsmiths, masons, basket and mat weavers, barbers, washermen and more — in a self-employed capacity. Three conditions apply: only one member per family can enrol, no family member should be in government service, and you must not have taken a loan under PMEGP, PM SVANidhi or Mudra in the last five years.',
      benefits_prose:
        'Benefits stack across the journey: a PM Vishwakarma certificate and ID card; five to seven days of basic skill training with a ₹500-per-day stipend; a ₹15,000 e-voucher for a modern toolkit; and collateral-free enterprise loans — ₹1 lakh as a first tranche and ₹2 lakh as a second — at a concessional 5% interest rate. Incentives for digital transactions and marketing support come on top.',
      how_to_apply:
        'Enrol at pmvishwakarma.gov.in or through a Common Service Centre with Aadhaar, mobile number, bank details and ration card. Registration passes a three-level verification — gram panchayat or ULB, district committee, and screening committee — before the ID is issued and training slots are allotted.',
    },
  },
  {
    id: 'mp-ladli-behna',
    slug: 'ladli-behna-yojana',
    name: 'Mukhyamantri Ladli Behna Yojana',
    level: 'state',
    state: 'Madhya Pradesh',
    categories: ['Women & Child', 'Income Support'],
    benefit: {
      type: 'cash',
      amount: 1500,
      frequency: 'monthly',
      note: 'Raised from ₹1,250 in late 2025; the state has announced a phased path to ₹3,000',
    },
    eligibility: {
      gender: 'female',
      age_min: 21,
      age_max: 60,
      income_max: 250000,
      residence_state: ['Madhya Pradesh'],
      other_flags: ['married_widowed_divorced_or_abandoned', 'not_income_tax_payer'],
    },
    documents: ['Samagra family ID', 'Aadhaar card', 'Aadhaar-linked, DBT-enabled bank account'],
    official_url: 'https://cmladlibahna.mp.gov.in/',
    source: 'CM Ladli Behna portal (cmladlibahna.mp.gov.in), Government of Madhya Pradesh',
    last_verified: null,
    en: {
      name: 'Ladli Behna Yojana (Madhya Pradesh)',
      summary:
        'Monthly support of ₹1,500 credited directly to the bank accounts of married women aged 21–60 from lower-income families in Madhya Pradesh.',
      eligibility_prose:
        'Women who are residents of Madhya Pradesh, aged 21 to 60, and married — including widowed, divorced or abandoned women — can apply. The household must sit outside the better-off bracket: combined family income under ₹2.5 lakh a year, no income-tax payer and no government employee in the family, less than five acres of land, and no four-wheeler (tractors excepted).',
      benefits_prose:
        'Eligible women receive ₹1,500 every month, credited directly to their Aadhaar-linked bank account (the amount was raised from ₹1,250 in late 2025, and the state has announced phased increases toward ₹3,000). Women over 60 who receive less than this under social-security pensions are topped up to the same level.',
      how_to_apply:
        'Applications are collected through gram panchayat, ward and anganwadi camps — a designated officer enters your pre-filled form on the portal, photographs you on the spot, and issues a printed acknowledgement. Keep your Samagra family ID, Aadhaar and an Aadhaar-linked, DBT-enabled bank account ready; new application windows open by government announcement.',
    },
  },
  {
    id: 'wb-kanyashree',
    slug: 'kanyashree-prakalpa',
    name: 'Kanyashree Prakalpa',
    level: 'state',
    state: 'West Bengal',
    categories: ['Women & Child', 'Education'],
    benefit: {
      type: 'cash',
      amount: 25000,
      frequency: 'one_time',
      note: 'K2 one-time grant of ₹25,000 at age 18; plus K1 annual scholarship from 13–18',
    },
    eligibility: {
      gender: 'female',
      age_min: 13,
      age_max: 18,
      residence_state: ['West Bengal'],
      other_flags: ['unmarried', 'enrolled_in_education'],
    },
    documents: [
      'Birth certificate / age proof',
      "Bank account in the girl's name",
      'Unmarried declaration (signed by guardian)',
    ],
    official_url: 'https://www.wbkanyashree.gov.in/',
    source: 'Kanyashree portal (wbkanyashree.gov.in), Government of West Bengal',
    last_verified: null,
    en: {
      name: 'Kanyashree Prakalpa (West Bengal)',
      summary:
        'Annual scholarships for unmarried girls aged 13–18 in education, and a one-time ₹25,000 grant at 18 — West Bengal’s flagship against child marriage.',
      eligibility_prose:
        'K1 (annual): unmarried girls aged 13–18, resident in West Bengal and enrolled in class 8 or above at a recognised school, madrasah, or an equivalent open-schooling or vocational course. The earlier family income ceiling of ₹1.2 lakh has been removed, so the scheme is open regardless of income. K2 (one-time): girls who turn 18 while still unmarried and still in education or training.',
      benefits_prose:
        'K1 pays an annual scholarship (₹1,000 a year) from age 13 to 18 to keep girls in school. K2 is a one-time grant of ₹25,000 paid at 18 to support higher education or vocational training — conditional on being unmarried at that point, which is the scheme’s quiet weapon against child marriage.',
      how_to_apply:
        'Collect the application form from your school or institution — the institution itself submits it on the Kanyashree portal (wbkanyashree.gov.in). You will need a bank account in the girl’s name, age proof and an unmarried declaration; K2 applicants upgrade their existing K1 ID, and status can be tracked on the portal.',
    },
  },
];
