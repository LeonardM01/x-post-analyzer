import { callGrok, MODELS } from '../client.js';

const SCHEMA = {
  type: 'object',
  required: ['isSpammy', 'reasoning'],
  properties: {
    isSpammy: { type: 'boolean' },
    reasoning: { type: 'string' },
  },
  additionalProperties: false,
};

const SYSTEM = `You are a spam classifier for X/Twitter posts. Determine whether this tweet would be flagged by the SpamEasiLowFollowerClassifier. Consider: reply-bait phrases, follow-for-follow patterns, suspicious calls to action, and engagement manipulation. Return true if spammy, false if legitimate.`;

export default async function gradeSpam(tweetText, { hasFollowerContext }) {
  const userPrompt = hasFollowerContext
    ? `[Account has established follower context]\n\n${tweetText}`
    : tweetText;

  const result = await callGrok({
    model: MODELS.mini,
    system: SYSTEM,
    user: userPrompt,
    schema: SCHEMA,
  });

  return {
    isSpammy: result.isSpammy,
    reasoning: result.reasoning,
    source: 'grok',
  };
}
