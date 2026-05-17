// WHY: structured outputs require json_schema response_format; xAI prompt cache auto-applies to stable system prefixes

const ENDPOINT = 'https://api.x.ai/v1/chat/completions';
const TIMEOUT_MS = 15000;

export const MODELS = { mini: 'grok-3-mini', full: 'grok-3' };

function resolveKey(apiKey) {
  if (apiKey) return apiKey;
  if (typeof process !== 'undefined' && process.env?.XAI_API_KEY) return process.env.XAI_API_KEY;
  return null;
}

export function isEnabled(apiKey) {
  return !!resolveKey(apiKey);
}

export async function callGrok({ model, system, user, schema, apiKey }) {
  const key = resolveKey(apiKey);
  if (!key) throw new Error('No XAI_API_KEY available');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
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
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    // WHY: response body may echo auth context; never include in thrown errors
    throw new Error(`Grok API error ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
