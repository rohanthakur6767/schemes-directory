// ---------------------------------------------------------------------------
// UI message catalog (D4 i18n). One key per UI string; values may contain
// {placeholders} that t() fills. Locale is a route param, so lookups happen at
// build time (server components) or via the locale prop (client components) —
// no runtime i18n library needed for the static export.
//
// `en` is the source of truth for the key set; `hi` must provide every key
// (TypeScript enforces this via Record<MessageKey, string>). Add new locales by
// adding another Record<MessageKey, string> dict + a DICTS entry.
// ---------------------------------------------------------------------------
import { DEFAULT_LOCALE } from './i18n.ts';

type Params = Record<string, string | number>;

const en = {
  // Top navigation
  'nav.browse': 'Browse',
  'nav.checkEligibility': 'Check eligibility',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',

  // Footer
  'footer.about': 'About',
  'footer.privacy': 'Privacy Policy',
  'footer.disclaimer': 'Disclaimer',
  'footer.contact': 'Contact',
  'footer.independence':
    '{site} is an independent informational website. We are not affiliated with, ' +
    'or endorsed by, the Government of India or any state government. Scheme details ' +
    'can change — always verify on the official source linked on each page before applying.',
  'footer.dataSource':
    'Data compiled from official government sources (Open Government Data licence — ' +
    'GODL-India), rewritten and verified by us.',
  'footer.officialPortals': 'Official government portals',

  // Site metadata
  'meta.homeTitle': '{site} — Indian Government Schemes Directory',
  'meta.titleTemplate': '%s | {site}',
  'meta.description':
    'Find central and state government schemes in India you may be eligible for. ' +
    'Original, verified summaries with links to official sources.',

  // Home page
  'home.heroH1': 'Find government schemes made for you',
  'home.heroSub':
    'Search {count}+ central and state schemes — see what you can get, who can apply, ' +
    'and how. Free, and your details never leave your phone.',
  'home.ctaCheck': 'Check what you qualify for →',
  'home.ctaBrowse': 'Browse all schemes',
  'home.popularCentral': 'Popular central schemes',
  'home.viewAll': 'View all schemes →',
  'home.howItWorks': 'How it works',
  'home.stepNo': 'Step {n}',
  'home.step.find.title': 'Find your scheme',
  'home.step.find.text':
    'Browse by category, state, or who it’s for — across central and state government.',
  'home.step.check.title': 'Check your eligibility',
  'home.step.check.text':
    'Answer a few quick questions and see the schemes you likely qualify for. ' +
    'Private — answers never leave your browser.',
  'home.step.apply.title': 'Apply on the official site',
  'home.step.apply.text':
    'We link you straight to the government’s own portal. Always free, no middlemen.',
  'home.browseByState': 'Browse by state',
  'home.browseByCategory': 'Browse by category',

  // Shared
  'count.scheme.one': '{n} scheme',
  'count.scheme.other': '{n} schemes',
  'common.central': 'Central',

  // Search box
  'search.placeholderHero': 'Search schemes — e.g. farmer, scholarship, pension',
  'search.placeholderNav': 'Search schemes…',
  'search.label': 'Search schemes',
  'search.loading': 'Loading…',
  'search.noResults': 'No schemes match “{q}”.',

  // Scheme detail page
  'common.home': 'Home',
  'scheme.breadcrumb': 'Breadcrumb',
  'scheme.centralScheme': 'Central scheme',
  'scheme.benefits': 'Benefits',
  'scheme.whoCanApply': 'Who can apply',
  'scheme.howToApply': 'How to apply',
  'scheme.applyOfficial': 'Apply on the official website ↗',
  'scheme.documentsRequired': 'Documents required',
  'scheme.relevantLinks': 'Relevant links',
  'scheme.contactInfo': 'Contact information',
  'scheme.tollFree': 'Toll-free',
  'scheme.phone': 'Phone',
  'scheme.email': 'Email',
  'scheme.faqsTitle': 'Frequently asked questions',
  'scheme.keyTerms': 'Key terms explained',
  'scheme.source': 'Source: {source}.',
  'scheme.lastVerified': 'Facts last verified on {date}.',
  'scheme.reverifying':
    'Facts are being re-verified against the official source — please confirm ' +
    'details there before applying.',
  'scheme.freq.oneTime': 'one-time',
  'scheme.freq.monthly': 'per month',
  'scheme.freq.yearly': 'per year',
  'scheme.level': 'Level',
  'scheme.centralAllIndia': 'Central (all-India)',
  'scheme.category': 'Category',
  'scheme.benefitType': 'Benefit type',
  'scheme.visitOfficial': 'Visit official website ↗',
  'scheme.onThisPage': 'On this page',
  'scheme.toc.documents': 'Documents',
  'scheme.toc.faqs': 'FAQs',
  'scheme.toc.contact': 'Contact',
  'scheme.toc.keyTerms': 'Key terms',
  'benefit.type.cash': 'cash',
  'benefit.type.pension': 'pension',
  'benefit.type.insurance': 'insurance',
  'benefit.type.loan': 'loan',
  'benefit.type.subsidy': 'subsidy',
  'benefit.type.savings': 'savings',
  'benefit.type.scholarship': 'scholarship',
  'benefit.type.service': 'service',

  // Eligibility "facts" chips (lib/format.ts)
  'facts.ageRange': 'Age {min}–{max}',
  'facts.ageMin': 'Age {min}+',
  'facts.ageMax': 'Age up to {max}',
  'facts.income': 'Household income ≤ {amount}/year',
  'facts.womenOnly': 'Women / girls only',
  'facts.menOnly': 'Men only',
  'facts.for': 'For: {list}',
  'facts.category': 'Category: {list}',
  'facts.resident': 'Resident of {list}',

  // Checker page wrapper
  'checker.metaTitle': 'Eligibility checker',
  'checker.metaDescription':
    'Answer a few questions and find Indian government schemes you may be eligible for. ' +
    'Private — your answers never leave your browser.',
  'checker.pageH1': 'Which schemes do you qualify for?',
  'checker.pageIntro':
    'Answer a few quick questions — every one is optional, and your answers never leave your browser.',

  // Checker wizard
  'checker.q.age': 'How old are you?',
  'checker.q.gender': 'What is your gender?',
  'checker.q.state': 'Which state do you live in?',
  'checker.q.income': 'Your family’s total yearly income?',
  'checker.q.caste': 'Your social category?',
  'checker.q.occupation': 'Which of these describe you?',
  'checker.resultsCount': '{n} of {total} schemes may fit you',
  'checker.eligibleHeading': '✅ You likely qualify',
  'checker.maybeHeading': '🟡 You may qualify — confirm the conditions',
  'checker.noMatches': 'No matches. Try changing an answer — leaving fields blank widens the results.',
  'checker.changeAnswers': '← Change answers',
  'checker.startOver': 'Start over',
  'checker.privacyDone': '🔒 Your answers stayed in your browser — nothing was sent to any server.',
  'checker.stepMeta': 'Step {step} of {total} · {n} schemes match so far · every question is optional',
  'checker.womanGirl': 'Woman / Girl',
  'checker.manBoy': 'Man / Boy',
  'checker.preferNotToSay': 'Prefer not to say',
  'checker.anotherState': 'Another state / UT',
  'checker.casteGeneral': 'General',
  'checker.tapAll': 'Tap all that apply.',
  'checker.seeResults': 'See my results →',
  'checker.skip': 'Skip',
  'checker.continue': 'Continue →',
  'checker.back': '← Back',
  'checker.ageSuffix': 'years',
  'checker.agePlaceholder': 'e.g. 30',
  'checker.incomeSuffix': '/ year',
  'checker.incomePlaceholder': 'e.g. 250000',
  'checker.incomeHelp': 'Add up everyone in your household. Not sure? Skip it.',
  'checker.likelyEligible': '✓ Likely eligible',
  'checker.mayQualify': 'May qualify',

  // Matcher reasons (lib/matcher.ts)
  'match.age.upTo': 'up to {max}',
  'match.age.pass': 'Your age fits the {range} range',
  'match.age.confirm': 'Age must be {range}',
  'match.income.pass': 'Household income within {amount}/year',
  'match.income.confirm': 'Household income must be ≤ {amount}/year',
  'match.gender.passFemale': 'For women / girls',
  'match.gender.passMale': 'For men',
  'match.gender.confirmFemale': 'Applicant must be a woman / girl',
  'match.gender.confirmMale': 'Applicant must be male',
  'match.occupation.pass': 'Matches your occupation',
  'match.caste.pass': 'Open to your category ({caste})',
  'match.caste.confirm': 'Category must be one of: {list}',
  'match.state.pass': 'You live in an eligible state',
  'match.state.confirm': 'Must reside in {list}',
  'match.alsoRequires': 'Also requires: {flag}',
};

export type MessageKey = keyof typeof en;

const hi: Record<MessageKey, string> = {
  'nav.browse': 'योजनाएँ देखें',
  'nav.checkEligibility': 'पात्रता जाँचें',
  'nav.openMenu': 'मेनू खोलें',
  'nav.closeMenu': 'मेनू बंद करें',

  'footer.about': 'हमारे बारे में',
  'footer.privacy': 'गोपनीयता नीति',
  'footer.disclaimer': 'अस्वीकरण',
  'footer.contact': 'संपर्क करें',
  'footer.independence':
    '{site} एक स्वतंत्र जानकारीपरक वेबसाइट है। हम भारत सरकार या किसी राज्य सरकार से न तो ' +
    'संबद्ध हैं और न ही उनके द्वारा अनुमोदित। योजनाओं का विवरण बदल सकता है — आवेदन करने से ' +
    'पहले हमेशा प्रत्येक पृष्ठ पर दिए गए आधिकारिक स्रोत पर पुष्टि करें।',
  'footer.dataSource':
    'डेटा आधिकारिक सरकारी स्रोतों (ओपन गवर्नमेंट डेटा लाइसेंस — GODL-India) से संकलित, ' +
    'हमारे द्वारा पुनर्लिखित और सत्यापित।',
  'footer.officialPortals': 'आधिकारिक सरकारी पोर्टल',

  'meta.homeTitle': '{site} — भारतीय सरकारी योजनाएँ निर्देशिका',
  'meta.titleTemplate': '%s | {site}',
  'meta.description':
    'भारत में केंद्र और राज्य सरकार की योजनाएँ खोजें जिनके लिए आप पात्र हो सकते हैं। ' +
    'मूल, सत्यापित सारांश और आधिकारिक स्रोतों के लिंक।',

  // Home page
  'home.heroH1': 'आपके लिए बनी सरकारी योजनाएँ खोजें',
  'home.heroSub':
    '{count}+ केंद्र और राज्य की योजनाएँ खोजें — जानें आपको क्या मिल सकता है, कौन आवेदन कर ' +
    'सकता है, और कैसे। निःशुल्क, और आपकी जानकारी कभी आपके फ़ोन से बाहर नहीं जाती।',
  'home.ctaCheck': 'देखें आप किसके लिए पात्र हैं →',
  'home.ctaBrowse': 'सभी योजनाएँ देखें',
  'home.popularCentral': 'लोकप्रिय केंद्रीय योजनाएँ',
  'home.viewAll': 'सभी योजनाएँ देखें →',
  'home.howItWorks': 'यह कैसे काम करता है',
  'home.stepNo': 'चरण {n}',
  'home.step.find.title': 'अपनी योजना खोजें',
  'home.step.find.text':
    'श्रेणी, राज्य, या किसके लिए है — केंद्र और राज्य सरकार दोनों में देखें।',
  'home.step.check.title': 'अपनी पात्रता जाँचें',
  'home.step.check.text':
    'कुछ त्वरित सवालों के जवाब दें और देखें कि आप किन योजनाओं के लिए पात्र हो सकते हैं। ' +
    'निजी — आपके उत्तर कभी आपके ब्राउज़र से बाहर नहीं जाते।',
  'home.step.apply.title': 'आधिकारिक साइट पर आवेदन करें',
  'home.step.apply.text':
    'हम आपको सीधे सरकार के अपने पोर्टल पर ले जाते हैं। हमेशा निःशुल्क, कोई बिचौलिया नहीं।',
  'home.browseByState': 'राज्य अनुसार देखें',
  'home.browseByCategory': 'श्रेणी अनुसार देखें',

  // Shared
  'count.scheme.one': '{n} योजना',
  'count.scheme.other': '{n} योजनाएँ',
  'common.central': 'केंद्रीय',

  // Search box
  'search.placeholderHero': 'योजनाएँ खोजें — जैसे किसान, छात्रवृत्ति, पेंशन',
  'search.placeholderNav': 'योजनाएँ खोजें…',
  'search.label': 'योजनाएँ खोजें',
  'search.loading': 'लोड हो रहा है…',
  'search.noResults': '“{q}” से मेल खाने वाली कोई योजना नहीं।',

  // Scheme detail page
  'common.home': 'होम',
  'scheme.breadcrumb': 'पृष्ठ पथ',
  'scheme.centralScheme': 'केंद्रीय योजना',
  'scheme.benefits': 'लाभ',
  'scheme.whoCanApply': 'कौन आवेदन कर सकता है',
  'scheme.howToApply': 'आवेदन कैसे करें',
  'scheme.applyOfficial': 'आधिकारिक वेबसाइट पर आवेदन करें ↗',
  'scheme.documentsRequired': 'आवश्यक दस्तावेज़',
  'scheme.relevantLinks': 'संबंधित लिंक',
  'scheme.contactInfo': 'संपर्क जानकारी',
  'scheme.tollFree': 'टोल-फ़्री',
  'scheme.phone': 'फ़ोन',
  'scheme.email': 'ईमेल',
  'scheme.faqsTitle': 'अक्सर पूछे जाने वाले प्रश्न',
  'scheme.keyTerms': 'मुख्य शब्दों की व्याख्या',
  'scheme.source': 'स्रोत: {source}।',
  'scheme.lastVerified': 'तथ्य अंतिम बार {date} को सत्यापित।',
  'scheme.reverifying':
    'तथ्यों को आधिकारिक स्रोत के विरुद्ध पुनः सत्यापित किया जा रहा है — आवेदन करने से ' +
    'पहले कृपया वहाँ विवरण की पुष्टि करें।',
  'scheme.freq.oneTime': 'एकमुश्त',
  'scheme.freq.monthly': 'प्रति माह',
  'scheme.freq.yearly': 'प्रति वर्ष',
  'scheme.level': 'स्तर',
  'scheme.centralAllIndia': 'केंद्रीय (अखिल भारतीय)',
  'scheme.category': 'श्रेणी',
  'scheme.benefitType': 'लाभ का प्रकार',
  'scheme.visitOfficial': 'आधिकारिक वेबसाइट पर जाएँ ↗',
  'scheme.onThisPage': 'इस पृष्ठ पर',
  'scheme.toc.documents': 'दस्तावेज़',
  'scheme.toc.faqs': 'सामान्य प्रश्न',
  'scheme.toc.contact': 'संपर्क',
  'scheme.toc.keyTerms': 'मुख्य शब्द',
  'benefit.type.cash': 'नकद',
  'benefit.type.pension': 'पेंशन',
  'benefit.type.insurance': 'बीमा',
  'benefit.type.loan': 'ऋण',
  'benefit.type.subsidy': 'सब्सिडी',
  'benefit.type.savings': 'बचत',
  'benefit.type.scholarship': 'छात्रवृत्ति',
  'benefit.type.service': 'सेवा',

  // Eligibility "facts" chips (lib/format.ts)
  'facts.ageRange': 'आयु {min}–{max}',
  'facts.ageMin': 'आयु {min}+',
  'facts.ageMax': 'आयु {max} तक',
  'facts.income': 'पारिवारिक आय ≤ {amount}/वर्ष',
  'facts.womenOnly': 'केवल महिलाएँ / लड़कियाँ',
  'facts.menOnly': 'केवल पुरुष',
  'facts.for': 'के लिए: {list}',
  'facts.category': 'श्रेणी: {list}',
  'facts.resident': '{list} के निवासी',

  // Checker page wrapper
  'checker.metaTitle': 'पात्रता जाँच',
  'checker.metaDescription':
    'कुछ सवालों के जवाब दें और भारत सरकार की उन योजनाओं को खोजें जिनके लिए आप पात्र हो सकते हैं। ' +
    'निजी — आपके उत्तर कभी आपके ब्राउज़र से बाहर नहीं जाते।',
  'checker.pageH1': 'आप किन योजनाओं के लिए पात्र हैं?',
  'checker.pageIntro':
    'कुछ त्वरित सवालों के जवाब दें — हर सवाल वैकल्पिक है, और आपके उत्तर कभी आपके ब्राउज़र से बाहर नहीं जाते।',

  // Checker wizard
  'checker.q.age': 'आपकी आयु कितनी है?',
  'checker.q.gender': 'आपका लिंग क्या है?',
  'checker.q.state': 'आप किस राज्य में रहते हैं?',
  'checker.q.income': 'आपके परिवार की कुल वार्षिक आय?',
  'checker.q.caste': 'आपकी सामाजिक श्रेणी?',
  'checker.q.occupation': 'इनमें से कौन आप पर लागू होता है?',
  'checker.resultsCount': '{total} में से {n} योजनाएँ आपके लिए उपयुक्त हो सकती हैं',
  'checker.eligibleHeading': '✅ आप संभवतः पात्र हैं',
  'checker.maybeHeading': '🟡 आप पात्र हो सकते हैं — शर्तें जाँचें',
  'checker.noMatches': 'कोई मेल नहीं। कोई उत्तर बदलकर देखें — फ़ील्ड खाली छोड़ने से परिणाम बढ़ते हैं।',
  'checker.changeAnswers': '← उत्तर बदलें',
  'checker.startOver': 'फिर से शुरू करें',
  'checker.privacyDone': '🔒 आपके उत्तर आपके ब्राउज़र में ही रहे — किसी सर्वर पर कुछ नहीं भेजा गया।',
  'checker.stepMeta': 'चरण {step} / {total} · अब तक {n} योजनाएँ मेल खाती हैं · हर सवाल वैकल्पिक है',
  'checker.womanGirl': 'महिला / लड़की',
  'checker.manBoy': 'पुरुष / लड़का',
  'checker.preferNotToSay': 'नहीं बताना चाहते',
  'checker.anotherState': 'अन्य राज्य / केंद्रशासित प्रदेश',
  'checker.casteGeneral': 'सामान्य',
  'checker.tapAll': 'जो भी लागू हों, सभी चुनें।',
  'checker.seeResults': 'मेरे परिणाम देखें →',
  'checker.skip': 'छोड़ें',
  'checker.continue': 'आगे बढ़ें →',
  'checker.back': '← पीछे',
  'checker.ageSuffix': 'वर्ष',
  'checker.agePlaceholder': 'जैसे 30',
  'checker.incomeSuffix': '/ वर्ष',
  'checker.incomePlaceholder': 'जैसे 250000',
  'checker.incomeHelp': 'अपने घर के सभी सदस्यों की आय जोड़ें। पक्का नहीं? इसे छोड़ दें।',
  'checker.likelyEligible': '✓ संभवतः पात्र',
  'checker.mayQualify': 'पात्र हो सकते हैं',

  // Matcher reasons
  'match.age.upTo': '{max} तक',
  'match.age.pass': 'आपकी आयु {range} सीमा में आती है',
  'match.age.confirm': 'आयु {range} होनी चाहिए',
  'match.income.pass': 'पारिवारिक आय {amount}/वर्ष के भीतर',
  'match.income.confirm': 'पारिवारिक आय ≤ {amount}/वर्ष होनी चाहिए',
  'match.gender.passFemale': 'महिलाओं / लड़कियों के लिए',
  'match.gender.passMale': 'पुरुषों के लिए',
  'match.gender.confirmFemale': 'आवेदक महिला / लड़की होनी चाहिए',
  'match.gender.confirmMale': 'आवेदक पुरुष होना चाहिए',
  'match.occupation.pass': 'आपके व्यवसाय से मेल खाता है',
  'match.caste.pass': 'आपकी श्रेणी ({caste}) के लिए खुला',
  'match.caste.confirm': 'श्रेणी इनमें से एक होनी चाहिए: {list}',
  'match.state.pass': 'आप एक पात्र राज्य में रहते हैं',
  'match.state.confirm': '{list} में निवास आवश्यक',
  'match.alsoRequires': 'यह भी आवश्यक: {flag}',
};

const DICTS: Record<string, Record<MessageKey, string>> = { en, hi };

// Look up a UI string for `locale`, filling any {placeholders} from `params`.
// Falls back to the default locale, then to English, so a missing key never
// throws or renders blank.
export function t(locale: string, key: MessageKey, params?: Params): string {
  const dict = DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
  let s = dict[key] ?? en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

// "1 scheme" / "2 schemes" — locale-aware singular vs plural.
export function schemeCount(locale: string, n: number): string {
  return t(locale, n === 1 ? 'count.scheme.one' : 'count.scheme.other', { n });
}
