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

// Guided, one-question-per-step eligibility wizard. Reuses the pure, tested
// matcher (lib/matcher.ts) — this file is ONLY the flow/UX. Everything runs in
// the browser; answers never leave the device (D1).
const STEPS = ['age', 'gender', 'state', 'income', 'caste', 'occupation'] as const;
type StepId = (typeof STEPS)[number];

const QUESTION: Record<StepId, string> = {
  age: 'How old are you?',
  gender: 'What is your gender?',
  state: 'Which state do you live in?',
  income: 'Your family’s total yearly income?',
  caste: 'Your social category?',
  occupation: 'Which of these describe you?',
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
  const matches = useMemo(() => (entries ? matchAll(profile, entries) : []), [entries, profile]);

  if (entries === null) return <p>Loading…</p>;

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
    return (
      <div className="results">
        <p className="results-count">
          <strong>{eligible.length + maybe.length}</strong> of {entries.length} schemes may fit you
        </p>

        {eligible.length > 0 && (
          <section>
            <h2>✅ You likely qualify</h2>
            {eligible.map((m) => (
              <ResultCard key={m.scheme.id} match={m} locale={locale} />
            ))}
          </section>
        )}
        {maybe.length > 0 && (
          <section>
            <h2>🟡 You may qualify — confirm the conditions</h2>
            {maybe.map((m) => (
              <ResultCard key={m.scheme.id} match={m} locale={locale} />
            ))}
          </section>
        )}
        {eligible.length + maybe.length === 0 && (
          <p>No matches. Try changing an answer — leaving fields blank widens the results.</p>
        )}

        <div className="results-actions">
          <button className="wz-ghost" onClick={() => setStep(0)}>
            ← Change answers
          </button>
          <button className="wz-ghost" onClick={restart}>
            Start over
          </button>
        </div>
        <p className="wizard-privacy">🔒 Your answers stayed in your browser — nothing was sent to any server.</p>
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
          Step {step + 1} of {total} · {matches.length} schemes match so far · every question is optional
        </p>
      </div>

      <h2 className="wizard-q">{QUESTION[id]}</h2>

      {id === 'age' && (
        <NumberStep
          value={profile.age}
          suffix="years"
          placeholder="e.g. 30"
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
            Woman / Girl
          </Choice>
          <Choice active={profile.gender === 'male'} onClick={() => choose({ gender: 'male' })}>
            Man / Boy
          </Choice>
          <Choice muted onClick={() => choose({ gender: undefined })}>
            Prefer not to say
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
            Another state / UT
          </Choice>
          <Choice muted onClick={() => choose({ state: undefined })}>
            Prefer not to say
          </Choice>
        </div>
      )}

      {id === 'income' && (
        <NumberStep
          value={profile.income}
          prefix="₹"
          suffix="/ year"
          placeholder="e.g. 250000"
          help="Add up everyone in your household. Not sure? Skip it."
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
              {c === 'GEN' ? 'General' : c}
            </Choice>
          ))}
          <Choice muted onClick={() => choose({ caste: undefined })}>
            Prefer not to say
          </Choice>
        </div>
      )}

      {id === 'occupation' && (
        <>
          <p className="wizard-help">Tap all that apply.</p>
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
              ← Back
            </button>
            <button className="wz-primary" onClick={next}>
              See my results →
            </button>
          </div>
        </>
      )}

      {/* Single-select steps auto-advance; they still need a Back control. */}
      {(id === 'gender' || id === 'state' || id === 'caste') && (
        <div className="wizard-nav">
          <button className="wz-ghost" onClick={back} disabled={step === 0}>
            ← Back
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
  value,
  prefix,
  suffix,
  placeholder,
  help,
  onChange,
  onNext,
  onSkip,
}: {
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
          Skip
        </button>
        <button className="wz-primary" onClick={onNext}>
          Continue →
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
          {verdict === 'eligible' ? '✓ Likely eligible' : 'May qualify'}
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
