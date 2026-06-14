'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  deriveOccupations,
  deriveStates,
  matchAll,
  type Profile,
  type SchemeIndexEntry,
} from '@/lib/matcher';
import { humanizeFlag } from '@/lib/format';
import { t, type MessageKey } from '@/lib/messages';

// Guided, one-question-per-step eligibility wizard. Reuses the pure, tested
// matcher (lib/matcher.ts) — this file is ONLY the flow/UX. Everything runs in
// the browser; answers never leave the device (D1).
const STEPS = ['age', 'gender', 'state', 'income', 'caste', 'occupation'] as const;
type StepId = (typeof STEPS)[number];

const QUESTION_KEY: Record<StepId, MessageKey> = {
  age: 'checker.q.age',
  gender: 'checker.q.gender',
  state: 'checker.q.state',
  income: 'checker.q.income',
  caste: 'checker.q.caste',
  occupation: 'checker.q.occupation',
};

export default function Checker({ locale }: { locale: string }) {
  const [entries, setEntries] = useState<SchemeIndexEntry[] | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [step, setStep] = useState(0); // 0..STEPS.length ; === length → results

  useEffect(() => {
    fetch(`/index/${locale}/schemes.json`)
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [locale]);

  const occupations = useMemo(() => (entries ? deriveOccupations(entries) : []), [entries]);
  const states = useMemo(() => (entries ? deriveStates(entries) : []), [entries]);
  const matches = useMemo(
    () => (entries ? matchAll(profile, entries, locale) : []),
    [entries, profile, locale],
  );

  if (entries === null) return <p>{t(locale, 'search.loading')}</p>;

  const total = STEPS.length;
  const atResults = step >= total;
  const eligible = matches.filter((m) => m.verdict === 'eligible');
  const maybe = matches.filter((m) => m.verdict === 'maybe');

  const set = (patch: Partial<Profile>) => setProfile((p) => ({ ...p, ...patch }));
  const next = () => setStep((s) => Math.min(s + 1, total));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const restart = () => {
    setProfile({});
    setStep(0);
  };
  // Single-select: record the answer, then glide to the next step.
  const choose = (patch: Partial<Profile>) => {
    set(patch);
    setTimeout(next, 180);
  };
  const toggleOccupation = (o: string) =>
    set({
      occupation: profile.occupation?.includes(o)
        ? profile.occupation.filter((x) => x !== o)
        : [...(profile.occupation ?? []), o],
    });

  // -------- Results screen --------
  if (atResults) {
    const fitCount = eligible.length + maybe.length;
    // Split on the literal {n} so the count stays bold in any word order.
    const rc = t(locale, 'checker.resultsCount', { total: entries.length }).split('{n}');
    return (
      <div className="results">
        <p className="results-count">
          {rc[0]}<strong>{fitCount}</strong>{rc[1]}
        </p>

        {eligible.length > 0 && (
          <section>
            <h2>{t(locale, 'checker.eligibleHeading')}</h2>
            {eligible.map((m) => (
              <ResultCard key={m.scheme.id} match={m} locale={locale} />
            ))}
          </section>
        )}
        {maybe.length > 0 && (
          <section>
            <h2>{t(locale, 'checker.maybeHeading')}</h2>
            {maybe.map((m) => (
              <ResultCard key={m.scheme.id} match={m} locale={locale} />
            ))}
          </section>
        )}
        {eligible.length + maybe.length === 0 && <p>{t(locale, 'checker.noMatches')}</p>}

        <div className="results-actions">
          <button className="wz-ghost" onClick={() => setStep(0)}>
            {t(locale, 'checker.changeAnswers')}
          </button>
          <button className="wz-ghost" onClick={restart}>
            {t(locale, 'checker.startOver')}
          </button>
        </div>
        <p className="wizard-privacy">{t(locale, 'checker.privacyDone')}</p>
      </div>
    );
  }

  // -------- Question step --------
  const id = STEPS[step];
  return (
    <div className="wizard">
      <div className="wizard-top">
        <div className="wizard-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step}>
          <span style={{ width: `${(step / total) * 100}%` }} />
        </div>
        <p className="wizard-meta">
          {t(locale, 'checker.stepMeta', { step: step + 1, total, n: matches.length })}
        </p>
      </div>

      <h2 className="wizard-q">{t(locale, QUESTION_KEY[id])}</h2>

      {id === 'age' && (
        <NumberStep
          locale={locale}
          value={profile.age}
          suffix={t(locale, 'checker.ageSuffix')}
          placeholder={t(locale, 'checker.agePlaceholder')}
          onChange={(v) => set({ age: v })}
          onNext={next}
          onSkip={() => {
            set({ age: undefined });
            next();
          }}
        />
      )}

      {id === 'gender' && (
        <div className="choice-grid">
          <Choice active={profile.gender === 'female'} onClick={() => choose({ gender: 'female' })}>
            {t(locale, 'checker.womanGirl')}
          </Choice>
          <Choice active={profile.gender === 'male'} onClick={() => choose({ gender: 'male' })}>
            {t(locale, 'checker.manBoy')}
          </Choice>
          <Choice muted onClick={() => choose({ gender: undefined })}>
            {t(locale, 'checker.preferNotToSay')}
          </Choice>
        </div>
      )}

      {id === 'state' && (
        <div className="choice-grid choice-grid-tight">
          {states.map((s) => (
            <Choice key={s} active={profile.state === s} onClick={() => choose({ state: s })}>
              {s}
            </Choice>
          ))}
          <Choice active={profile.state === '__other__'} onClick={() => choose({ state: '__other__' })}>
            {t(locale, 'checker.anotherState')}
          </Choice>
          <Choice muted onClick={() => choose({ state: undefined })}>
            {t(locale, 'checker.preferNotToSay')}
          </Choice>
        </div>
      )}

      {id === 'income' && (
        <NumberStep
          locale={locale}
          value={profile.income}
          prefix="₹"
          suffix={t(locale, 'checker.incomeSuffix')}
          placeholder={t(locale, 'checker.incomePlaceholder')}
          help={t(locale, 'checker.incomeHelp')}
          onChange={(v) => set({ income: v })}
          onNext={next}
          onSkip={() => {
            set({ income: undefined });
            next();
          }}
        />
      )}

      {id === 'caste' && (
        <div className="choice-grid">
          {(['GEN', 'OBC', 'SC', 'ST'] as const).map((c) => (
            <Choice key={c} active={profile.caste === c} onClick={() => choose({ caste: c })}>
              {c === 'GEN' ? t(locale, 'checker.casteGeneral') : c}
            </Choice>
          ))}
          <Choice muted onClick={() => choose({ caste: undefined })}>
            {t(locale, 'checker.preferNotToSay')}
          </Choice>
        </div>
      )}

      {id === 'occupation' && (
        <>
          <p className="wizard-help">{t(locale, 'checker.tapAll')}</p>
          <div className="choice-grid choice-grid-tight">
            {occupations.map((o) => (
              <Choice
                key={o}
                active={profile.occupation?.includes(o) ?? false}
                onClick={() => toggleOccupation(o)}
              >
                {humanizeFlag(o)}
              </Choice>
            ))}
          </div>
          <div className="wizard-nav">
            <button className="wz-ghost" onClick={back}>
              {t(locale, 'checker.back')}
            </button>
            <button className="wz-primary" onClick={next}>
              {t(locale, 'checker.seeResults')}
            </button>
          </div>
        </>
      )}

      {/* Single-select steps auto-advance; they still need a Back control. */}
      {(id === 'gender' || id === 'state' || id === 'caste') && (
        <div className="wizard-nav">
          <button className="wz-ghost" onClick={back} disabled={step === 0}>
            {t(locale, 'checker.back')}
          </button>
        </div>
      )}
    </div>
  );
}

function Choice({
  children,
  active,
  muted,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`choice-card${active ? ' active' : ''}${muted ? ' muted' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function NumberStep({
  locale,
  value,
  prefix,
  suffix,
  placeholder,
  help,
  onChange,
  onNext,
  onSkip,
}: {
  locale: string;
  value: number | undefined;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  help?: string;
  onChange: (v: number | undefined) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <>
      <div className="number-field">
        {prefix && <span className="affix">{prefix}</span>}
        <input
          type="number"
          min={0}
          autoFocus
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          onKeyDown={(e) => e.key === 'Enter' && onNext()}
        />
        {suffix && <span className="affix">{suffix}</span>}
      </div>
      {help && <p className="wizard-help">{help}</p>}
      <div className="wizard-nav">
        <button className="wz-ghost" onClick={onSkip}>
          {t(locale, 'checker.skip')}
        </button>
        <button className="wz-primary" onClick={onNext}>
          {t(locale, 'checker.continue')}
        </button>
      </div>
    </>
  );
}

function ResultCard({
  match,
  locale,
}: {
  match: ReturnType<typeof matchAll>[number];
  locale: string;
}) {
  const { scheme, reasons, toConfirm, verdict } = match;
  return (
    <div className="result-card">
      <div className="result-head">
        <a href={`/${locale}/schemes/${scheme.slug}/`}>
          <strong>{scheme.name}</strong>
        </a>
        <span className={`verdict-pill verdict-${verdict}`}>
          {t(locale, verdict === 'eligible' ? 'checker.likelyEligible' : 'checker.mayQualify')}
        </span>
      </div>
      <p>{scheme.summary}</p>
      {reasons.length > 0 && (
        <ul className="why">
          {reasons.map((r) => (
            <li key={r}>✓ {r}</li>
          ))}
        </ul>
      )}
      {toConfirm.length > 0 && (
        <ul className="confirm">
          {toConfirm.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
