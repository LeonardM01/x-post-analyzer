import { callGrok, MODELS } from '../client.js';

const SCHEMA = {
  type: 'object',
  required: ['score', 'reasoning'],
  properties: {
    score: { type: 'number', minimum: 0, maximum: 1 },
    reasoning: { type: 'string', maxLength: 280 },
  },
  additionalProperties: false,
};

const SYSTEM = `You are a viral tweet classifier. Rate the post 0–1 on four dimensions: novelty (fresh idea vs. recycled take), hook strength (does the opening pull you in?), shareability (would someone screenshot or RT this?), and signal-to-cliché ratio (original voice vs. AI/marketing filler). Return a single score from 0.0 to 1.0, where ≥ 0.4 means a "banger". Be concise and direct in your reasoning.`;

export default async function gradeBanger(tweetText) {
  const result = await callGrok({
    model: MODELS.mini,
    system: SYSTEM,
    user: tweetText,
    schema: SCHEMA,
  });

  const { score, reasoning } = result;
  return {
    score,
    threshold: 0.4,
    isBanger: score >= 0.4,
    reasoning,
    source: 'grok',
  };
}
