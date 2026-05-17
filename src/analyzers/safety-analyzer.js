import { GROX_SAFETY_CATEGORIES } from '../algorithm-weights.js';
import * as grokClient from '../grok/client.js';
import gradeSafety from '../grok/classifiers/safety.js';

const CATEGORY_PATTERNS = {
  violent_media: [
    /\bblood(y|ied)?\b/i,
    /\bgore\b/i,
    /\bbeheading\b/i,
    /\bmutilat/i,
    /\bdecapitat/i,
    /\bbrutal (kill|murder|attack)/i,
    /\bslaughter\b/i,
    /\bvisceral\b/i,
  ],
  adult_content: [
    /\bporn(o|ographic)?\b/i,
    /\bnude(s|d)?\b/i,
    /\bnsfw\b/i,
    /\berotic\b/i,
    /\bsexual content\b/i,
    /\bonly fans\b/i,
    /\bonlyfans\b/i,
    /\bexplicit\b/i,
  ],
  spam: [
    /follow (back|for follow)/i,
    /f4f\b/i,
    /\bfollow4follow\b/i,
    /\bdm (for|me for) (promo|collab|deal)/i,
    /\b(make|earn) \$[\d,]+ (a day|per day|daily|weekly)/i,
    /\bclick (here|the link|below)/i,
    /drop your (link|ig|insta|twitter)\b/i,
    /\bshoutout for shoutout\b/i,
    /\bgiveaway.*follow/i,
    /\bfree (followers|likes|retweets)/i,
  ],
  illegal_regulated: [
    /\bbuy (cocaine|meth|heroin|fentanyl|weed|drugs)\b/i,
    /\bprescription (pills|meds) without/i,
    /\billegal (weapons|firearms|guns) for sale\b/i,
    /\bdark web\b/i,
    /\bmoney laundering\b/i,
    /\bhuman trafficking\b/i,
    /\bchild (labor|exploitation)\b/i,
  ],
  hate_abuse: [
    // Slur patterns intentionally omitted — pending a curated list to avoid false positives
    /\ball (jews|muslims|blacks|whites|gays) (are|should)\b/i,
    /\b(race|religion|gender) is inferior\b/i,
    /\bdie (you|all you)\b/i,
    /\bkill all\b/i,
    /go (back to|kill yourself)/i,
    /\bsubhuman\b/i,
    /\bvermin\b.*\bpeople\b/i,
  ],
  violent_speech: [
    /\bi (will|am going to|want to) (kill|hurt|attack|murder|shoot) (you|him|her|them)\b/i,
    /\bthreat(en|s)? (to kill|of violence)\b/i,
    /\bbomb threat\b/i,
    /\byou (will|should|deserve to) die\b/i,
    /\bshoot (up|the)\b/i,
    /\bmass (shooting|attack|murder)\b/i,
  ],
  self_harm: [
    /\b(want to|going to|will) (kill|end|hurt) my(self)?\b/i,
    /\bsuicid(e|al)\b/i,
    /\bself.harm\b/i,
    /\bcut(ting)? myself\b/i,
    /\boverdos(e|ing)\b/i,
    /\bno reason to live\b/i,
    /\bend it all\b/i,
  ],
};

function countMatches(text, patterns) {
  const matched = [];
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      matched.push(pattern.source);
    }
  }
  return matched;
}

function matchesToRisk(count) {
  if (count === 0) return 'low';
  if (count <= 2) return 'medium';
  return 'high';
}

export default async function safetyAnalyzer(tweetText, options = {}) {
  const { grokApiKey } = options;
  if (grokClient.isEnabled(grokApiKey)) {
    try {
      return await gradeSafety(tweetText, { apiKey: grokApiKey });
    } catch { /* fall through to heuristic */ }
  }

  const text = tweetText || '';
  const results = [];

  for (const category of GROX_SAFETY_CATEGORIES) {
    const patterns = CATEGORY_PATTERNS[category.id] || [];
    const matchedSignals = countMatches(text, patterns);
    const risk = matchesToRisk(matchedSignals.length);

    results.push({
      categoryId: category.id,
      label: category.label,
      risk,
      deluxeReasoningApplied: category.deluxe_reasoning,
      matchedSignals,
      source: 'heuristic',
    });
  }

  return results;
}
