// ---------------------------------------------------------------------------
// Thin OpenAI client (build-time only — never shipped to the browser, D1).
// Plain fetch + Structured Outputs; no SDK dependency (D10).
// ---------------------------------------------------------------------------

// THE SINGLE SWAPPABLE MODEL CONSTANT (per the brief). Cheap is correct — both
// our LLM tasks (structured extraction, prose rewriting) are easy. Change here.
export const STRUCTURED_MODEL = 'gpt-4o-mini';
export const PROSE_MODEL = 'gpt-4o-mini'; // used in Phase 5

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export type JsonSchema = Record<string, unknown>;

// Calls Chat Completions with a strict JSON Schema and returns the parsed object.
// Throws on HTTP error, refusal, or unparseable content — callers Zod-validate.
export async function callJSON(
  system: string,
  user: string,
  schemaName: string,
  schema: JsonSchema,
): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set (run via a script that loads .env).');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: STRUCTURED_MODEL,
      temperature: 0, // deterministic extraction — we want facts, not creativity
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: schemaName, strict: true, schema },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }
  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  if (msg?.refusal) throw new Error(`Model refused: ${msg.refusal}`);
  const content = msg?.content;
  if (typeof content !== 'string') throw new Error('No content in OpenAI response.');
  return JSON.parse(content);
}
