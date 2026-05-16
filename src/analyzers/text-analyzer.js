import { OPTIMAL_TWEET, SPAM_SIGNALS, REPLY_TRIGGERS } from '../algorithm-weights.js';

const CTA_PATTERNS = [
  /what do you think/i,
  /what['']s your/i,
  /do you agree/i,
  /thoughts\??/i,
  /agree or disagree/i,
  /let me know/i,
  /tell me/i,
  /share your/i,
  /how do you/i,
  /what would you/i,
  /reply with/i,
  /drop your/i,
  /comment below/i,
  /hot take/i,
  /unpopular opinion/i,
  /change my mind/i,
];

const THREAD_PATTERNS = [
  /^thread[:\s]/i,
  /\bthread\b.*👇/i,
  /\b(1\/|1\))\s/,
  /here['']s what/i,
  /a thread/i,
  /let me explain/i,
  /breakdown/i,
];

const OPINION_PATTERNS = [
  /i (think|believe|feel)\b/i,
  /honestly/i,
  /unpopular opinion/i,
  /hot take/i,
  /controversial/i,
  /overrated/i,
  /underrated/i,
  /the (best|worst|biggest)/i,
  /nobody talks about/i,
  /stop (doing|saying|posting)/i,
];

export function analyzeText(text) {
  const findings = {
    score: 100,
    issues: [],
    strengths: [],
    suggestions: [],
    metrics: {},
  };

  if (!text || text.trim().length === 0) {
    findings.score = 0;
    findings.issues.push({ severity: 'critical', message: 'Tweet is empty' });
    return findings;
  }

  const cleanText = text.trim();
  const charCount = cleanText.length;

  findings.metrics.char_count = charCount;
  const { text_length } = OPTIMAL_TWEET;

  if (charCount < text_length.min) {
    findings.score -= 25;
    findings.issues.push({
      severity: 'high',
      message: `Too short (${charCount} chars). Tweets under ${text_length.min} chars generate insufficient dwell_time — too fast a read to register as engagement.`,
    });
    findings.suggestions.push(`Expand to at least ${text_length.ideal_min} characters. At ~25 chars/sec read speed, ${text_length.ideal_min}-${text_length.ideal_max} chars hit the 3-8s dwell window that feeds the dwell_time head.`);
  } else if (charCount >= text_length.ideal_min && charCount <= text_length.ideal_max) {
    findings.strengths.push(`Good length (${charCount} chars) — hits the 3-8s dwell-time window (${text_length.ideal_min}-${text_length.ideal_max} chars at ~25 chars/sec).`);
  } else if (charCount > text_length.ideal_max) {
    findings.issues.push({
      severity: 'low',
      message: `Long tweet (${charCount} chars). Over ${text_length.ideal_max} chars may reduce scan-read completion and dwell efficiency.`,
    });
  }

  const hashtags = cleanText.match(/#\w+/g) || [];
  findings.metrics.hashtag_count = hashtags.length;

  if (hashtags.length > SPAM_SIGNALS.excessive_hashtags) {
    findings.score -= 20;
    findings.issues.push({
      severity: 'high',
      message: `Too many hashtags (${hashtags.length}). The algorithm treats ${SPAM_SIGNALS.excessive_hashtags}+ hashtags as spam-like behavior.`,
    });
    findings.suggestions.push(`Remove ${hashtags.length - OPTIMAL_TWEET.hashtags.ideal.max} hashtags. Use max ${OPTIMAL_TWEET.hashtags.ideal.max} relevant hashtags.`);
  } else if (hashtags.length >= 1 && hashtags.length <= OPTIMAL_TWEET.hashtags.ideal.max) {
    findings.strengths.push(`Good hashtag usage (${hashtags.length}) - within optimal range.`);
  }

  const mentions = cleanText.match(/@\w+/g) || [];
  findings.metrics.mention_count = mentions.length;

  if (mentions.length > SPAM_SIGNALS.excessive_mentions) {
    findings.score -= 15;
    findings.issues.push({
      severity: 'medium',
      message: `Too many mentions (${mentions.length}). Excessive @mentions trigger spam detection.`,
    });
    findings.suggestions.push('Reduce mentions to 1-2 max. Tag people in replies instead.');
  }

  const urls = cleanText.match(/https?:\/\/\S+/g) || [];
  findings.metrics.url_count = urls.length;

  if (urls.length > OPTIMAL_TWEET.urls.max_before_penalty) {
    findings.score -= 20;
    findings.issues.push({
      severity: 'high',
      message: `Multiple URLs detected (${urls.length}). The algorithm heavily de-prioritizes tweets with external links.`,
    });
    findings.suggestions.push('Remove extra links. Put links in the reply thread instead of the main tweet.');
  } else if (urls.length === 1) {
    findings.score -= 10;
    findings.issues.push({
      severity: 'medium',
      message: 'Contains a URL. The algorithm de-prioritizes external links to keep users on-platform.',
    });
    findings.suggestions.push('Consider posting the link in a reply to your main tweet instead.');
  } else if (urls.length === 0) {
    findings.strengths.push('No external links - the algorithm prefers on-platform content.');
  }

  const textWithoutUrls = cleanText.replace(/https?:\/\/\S+/g, '').trim();
  if (urls.length > 0 && textWithoutUrls.length < 20) {
    findings.score -= 25;
    findings.issues.push({
      severity: 'critical',
      message: 'Tweet is essentially just a URL. This gets minimal algorithmic distribution.',
    });
    findings.suggestions.push('Add substantial commentary or opinion about the linked content.');
  }

  const letters = cleanText.replace(/[^a-zA-Z]/g, '');
  const upperCase = letters.replace(/[^A-Z]/g, '');
  const capsRatio = letters.length > 0 ? upperCase.length / letters.length : 0;
  findings.metrics.caps_ratio = Math.round(capsRatio * 100);

  if (capsRatio > SPAM_SIGNALS.all_caps_ratio && letters.length > 10) {
    findings.score -= 15;
    findings.issues.push({
      severity: 'medium',
      message: `High caps ratio (${findings.metrics.caps_ratio}%). Excessive caps triggers spam detection.`,
    });
    findings.suggestions.push('Reduce ALL CAPS usage. Use it sparingly for emphasis on 1-2 words max.');
  }

  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;
  const emojis = cleanText.match(emojiRegex) || [];
  findings.metrics.emoji_count = emojis.length;

  if (emojis.length > SPAM_SIGNALS.excessive_emojis) {
    findings.score -= 10;
    findings.issues.push({
      severity: 'low',
      message: `Too many emojis (${emojis.length}). Excessive emoji usage can trigger spam signals.`,
    });
    findings.suggestions.push(`Reduce to ${SPAM_SIGNALS.excessive_emojis} or fewer emojis.`);
  }

  const repeatedChars = cleanText.match(/(.)\1{3,}/g) || [];
  if (repeatedChars.length > 0) {
    findings.score -= 10;
    findings.issues.push({
      severity: 'low',
      message: `Repeated characters detected ("${repeatedChars[0]}"). This looks spammy to the algorithm.`,
    });
    findings.suggestions.push('Avoid repeating characters excessively (e.g., "!!!!!!" or "sooooo").');
  }

  const hasQuestion = /\?/.test(cleanText);
  if (hasQuestion) {
    findings.strengths.push(
      `Contains a question — questions drive reply_score and dwell_time, two confirmed 2026 engagement heads.`
    );
    findings.score += 5;
  } else {
    findings.suggestions.push(
      'Add a question to encourage replies. Replies feed reply_score, dwell_time, and follow_author_score simultaneously.'
    );
  }

  const hasCTA = CTA_PATTERNS.some((p) => p.test(cleanText));
  if (hasCTA) {
    findings.strengths.push('Contains a call-to-action that encourages engagement.');
    findings.score += 3;
  }

  const hasOpinion = OPINION_PATTERNS.some((p) => p.test(cleanText));
  if (hasOpinion) {
    findings.strengths.push('Contains an opinion/take - strong opinions generate debate and replies.');
    findings.score += 3;
  }

  const isThread = THREAD_PATTERNS.some((p) => p.test(cleanText));
  if (isThread) {
    findings.strengths.push('Thread format detected - threads get extended engagement over time.');
    findings.score += 2;
  }

  const lineBreaks = (cleanText.match(/\n/g) || []).length;
  findings.metrics.line_breaks = lineBreaks;

  if (charCount > 150 && lineBreaks === 0) {
    findings.suggestions.push('Add line breaks for readability. Well-formatted tweets get more engagement.');
  }

  findings.score = Math.max(0, Math.min(100, findings.score));

  return findings;
}
