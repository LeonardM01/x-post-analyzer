// WHY: structured outputs require json_schema response_format; xAI prompt cache auto-applies to stable system prefixes

const ENDPOINT = 'https://api.x.ai/v1/chat/completions';
const TIMEOUT_MS = 15000;

export const MODELS = { mini: 'grok-3-mini', full: 'grok-3' };

export function isEnabled() {
  return !!process.env.XAI_API_KEY;
}

export async function callGrok({ model, system, user, schema, signal: externalSignal }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const combinedSignal = externalSignal
    ? AbortSignal.any([controller.signal, externalSignal])
    : controller.signal;

  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'classifier_output', schema, strict: true },
        },
        temperature: 0,
      }),
      signal: combinedSignal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Grok API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
