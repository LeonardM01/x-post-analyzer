const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
  'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
  'our', 'their', 'what', 'which', 'who', 'how', 'when', 'where', 'why',
  'not', 'no', 'so', 'if', 'then', 'than', 'just', 'also', 'about',
  'up', 'out', 'there', 'here', 'into', 'more', 'get', 'all', 'some',
]);

const TIMEFRAME_WORDS = new Set([
  'today', 'yesterday', 'tomorrow', 'week', 'month', 'year', 'now',
  'tonight', 'morning', 'evening', 'recent', 'latest', 'current',
  '2024', '2025', '2026', '2027',
]);

const CLICHE_LIST = [
  'game changer',
  'game-changer',
  'thread below',
  'let that sink in',
  'mind blown',
  'take notes',
  'bookmark this',
  "here's why",
  'the truth is',
];

const CONTRARIAN_PATTERNS = [
  /everyone (is|was) wrong/i,
  /nobody talks about/i,
  /unpopular opinion/i,
  /most people (don't|dont|never|ignore)/i,
  /stop (doing|saying|using|posting)/i,
  /\bwrong\b.*\bwrong\b/i,
];

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function computeNovelty(tokens) {
  if (tokens.length < 2) return 0;
  const bigrams = new Set();
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.add(`${tokens[i]}|${tokens[i + 1]}`);
  }
  const totalBigrams = tokens.length - 1;
  const uniqueRatio = bigrams.size / totalBigrams;

  const freqMap = {};
  for (const t of tokens) {
    freqMap[t] = (freqMap[t] || 0) + 1;
  }
  let entropy = 0;
  for (const count of Object.values(freqMap)) {
    const p = count / tokens.length;
    entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(tokens.length) || 1;
  const normalizedEntropy = entropy / maxEntropy;

  return Math.min(1, (uniqueRatio + normalizedEntropy) / 2);
}

function computeSpecificity(tokens, originalText) {
  if (tokens.length === 0) return 0;
  let specific = 0;
  const digitMatches = (originalText.match(/\d+/g) || []).length;
  specific += digitMatches;

  const words = originalText.split(/\s+/);
  for (const word of words) {
    const cleaned = word.replace(/[^a-zA-Z]/g, '');
    if (cleaned.length > 2 && /^[A-Z]/.test(cleaned) && !STOP_WORDS.has(cleaned.toLowerCase())) {
      specific++;
    }
  }

  for (const token of tokens) {
    if (TIMEFRAME_WORDS.has(token)) specific++;
  }

  return Math.min(1, specific / tokens.length);
}

function computeHookStrength(text) {
  const hook = text.slice(0, 12);
  let score = 0;

  if (/\?/.test(hook)) score += 0.4;
  if (/^\d/.test(hook.trim())) score += 0.4;

  const firstWord = hook.trim().split(/\s/)[0] || '';
  if (/^[A-Z]{2,}/.test(firstWord) && firstWord === firstWord.toUpperCase() && firstWord.length > 1) {
    score += 0.3;
  }

  for (const pattern of CONTRARIAN_PATTERNS) {
    if (pattern.test(text)) {
      score += 0.5;
      break;
    }
  }

  return Math.min(1, score);
}

function computeShareability(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.length >= 30 && line.length <= 120 && /[.!?]$/.test(line)) return 1;
  }
  const trimmed = text.trim();
  if (trimmed.length >= 30 && trimmed.length <= 120 && /[.!?]$/.test(trimmed)) return 1;
  if (trimmed.length <= 120) return 0.5;
  return 0;
}

function computeClicheDensity(text) {
  const lower = text.toLowerCase();
  let score = 1.0;
  for (const cliche of CLICHE_LIST) {
    if (lower.includes(cliche)) score -= 0.15;
  }
  return Math.max(0, score);
}

export default function bangerPredictor(tweetText, options = {}) {
  const tokens = tokenize(tweetText || '');

  const novelty = computeNovelty(tokens);
  const specificity = computeSpecificity(tokens, tweetText || '');
  const hookStrength = computeHookStrength(tweetText || '');
  const shareability = computeShareability(tweetText || '');
  const clicheDensity = computeClicheDensity(tweetText || '');

  const score = Math.min(1, Math.max(0,
    novelty * 0.20 +
    specificity * 0.20 +
    hookStrength * 0.25 +
    shareability * 0.20 +
    clicheDensity * 0.15,
  ));

  const threshold = 0.4;

  return {
    score,
    threshold,
    isBanger: score >= threshold,
    factors: { novelty, specificity, hookStrength, shareability, clicheDensity },
  };
}
