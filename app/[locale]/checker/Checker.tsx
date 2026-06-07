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

const OTHER_STATE = '__other__';

export default function Checker({ locale }: { locale: string }) {
  const [entries, setEntries] = useState<SchemeIndexEntry[] | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [touched, setTouched] = useState(false);

  // The ONLY network call this feature makes: one static JSON file. Everything
  // after this runs in-browser — the user's answers never leave the device (D1).
  useEffect(() => {
    fetch(`/index/${locale}/schemes.json`)
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [locale]);

  const occupations = useMemo(() => (entries ? deriveOccupations(entries) : []), [entries]);
  const states = useMemo(() => (entries ? deriveStates(entries) : []), [entries]);
  const matches = useMemo(
    () => (entries ? matchAll(profile, entries) : []),
    [entries, profile],
  );

  if (entries === null) return <p>Loading…</p>;

  const set = (patch: Partial<Profile>) => {
    setTouched(true);
    setProfile((p) => ({ ...p, ...patch }));
  };

  const toggleOccupation = (o: string) =>
    set({
      occupation: profile.occupation?.includes(o)
        ? profile.occupation.filter((x) => x !== o)
        : [...(profile.occupation ?? []), o],
    });

  const eligible = matches.filter((m) => m.verdict === 'eligible');
  const maybe = matches.filter((m) => m.verdict === 'maybe');

  return (
    <div className="checker">
      <form className="checker-form" onSubmit={(e) => e.preventDefault()}>
        <p className="privacy">
          🔒 Your answers stay in your browser — nothing is sent to any server.
        </p>

        <label>
          Age
          <input
            type="number"
            min={0}
            value={profile.age ?? ''}
            onChange={(e) =>
              set({ age: e.target.value === '' ? undefined : Number(e.target.value) })
            }
          />
        </label>

        <label>
          Gender
          <select
            value={profile.gender ?? ''}
            onChange={(e) =>
              set({ gender: (e.target.value || undefined) as Profile['gender'] })
            }
          >
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>

        <label>
          Annual household income (₹)
          <input
            type="number"
            min={0}
            value={profile.income ?? ''}
            onChange={(e) =>
              set({ income: e.target.value === '' ? undefined : Number(e.target.value) })
            }
          />
        </label>

        <label>
          Social category
          <select
            value={profile.caste ?? ''}
            onChange={(e) =>
              set({ caste: (e.target.value || undefined) as Profile['caste'] })
            }
          >
            <option value="">Prefer not to say</option>
            <option value="GEN">General</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
          </select>
        </label>

        <label>
          State of residence
          <select
            value={profile.state ?? ''}
            onChange={(e) => set({ state: e.target.value || undefined })}
          >
            <option value="">Prefer not to say</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value={OTHER_STATE}>Another state / UT</option>
          </select>
        </label>

        <fieldset>
          <legend>Which describe you? (optional)</legend>
          {occupations.map((o) => (
            <label key={o} className="inline">
              <input
                type="checkbox"
                checked={profile.occupation?.includes(o) ?? false}
                onChange={() => toggleOccupation(o)}
              />
              {humanizeFlag(o)}
            </label>
          ))}
        </fieldset>
      </form>

      <div className="checker-results">
        {!touched ? (
          <p>Answer a few questions to see schemes you may qualify for.</p>
        ) : (
          <>
            <h2>
              {eligible.length + maybe.length} of {entries.length} schemes may fit you
            </h2>

            {eligible.length > 0 && (
              <section>
                <h3>You likely qualify</h3>
                {eligible.map((m) => (
                  <ResultCard key={m.scheme.id} match={m} locale={locale} />
                ))}
              </section>
            )}

            {maybe.length > 0 && (
              <section>
                <h3>You may qualify — confirm the conditions below</h3>
                {maybe.map((m) => (
                  <ResultCard key={m.scheme.id} match={m} locale={locale} />
                ))}
              </section>
            )}

            {eligible.length + maybe.length === 0 && (
              <p>No matches yet. Try clearing a field — leaving an answer blank widens the search.</p>
            )}
          </>
        )}
      </div>
    </div>
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
