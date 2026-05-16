// WHY: EQ-Bench / Antislop research (arxiv 2510.15061, ICLR 2026) shows slop patterns
// correlate strongly with not_interested / block_author / mute_author — the exact negative
// heads that suppress banger score in the 2026 Grox scoring pipeline.

const SLOP_WORDS_CRITICAL = [
  'delve', 'tapestry', 'multifaceted', 'commendable', 'meticulous',
  'intricate', 'pivotal', 'nuanced', 'comprehensive', 'testament',
  'paradigm', 'burgeoning', 'underscores', 'underpins',
];

const SLOP_WORDS_HIGH = [
  'robust', 'unprecedented', 'unparalleled', 'showcasing', 'leverage',
  'captivating', 'embark', 'boundless', 'revolutionize', 'cutting-edge',
  'realm', 'landscape', 'crucial', 'vibrant', 'foster', 'spearhead',
  'groundbreaking', 'transformative', 'holistic', 'synergy', 'harness',
  'navigate', 'beacon', 'cornerstone', 'catalyst', 'empower',
  'endeavor', 'intricacies', 'paramount', 'indispensable',
  'elucidates', 'delineate', 'juxtaposition', 'quintessential',
];

const SLOP_WORDS_MEDIUM = [
  'Moreover', 'Furthermore', 'Notably', 'Importantly', 'Ultimately',
  'Essentially', 'Fundamentally', 'Consequently', 'Subsequently',
  'Interestingly', 'Remarkably', 'Significantly', 'Specifically',
  'Accordingly', 'Nevertheless', 'Notwithstanding', 'Henceforth',
  'Whereas', 'Thereby', 'Evidently',
  'insightful', 'pivotal', 'myriad', 'plethora', 'diverse',
  'innovative', 'streamline', 'optimize', 'cultivate', 'underscore',
  'encompass', 'bolster', 'augment', 'facilitate', 'elucidate',
  'aligns', 'resonates', 'underscored', 'nuances',
];

const SLOP_PHRASES = [
  // Opening patterns
  { pattern: /^in today['']s (fast-paced|ever-evolving|digital|rapidly changing)/i, name: 'Generic AI opening', severity: 'critical' },
  { pattern: /^in (a|an|the) world where/i, name: '"In a world where" opening', severity: 'critical' },
  { pattern: /^in (the|this) (realm|landscape|arena) of/i, name: '"In the realm of" opening', severity: 'high' },
  { pattern: /^(it['']s|it is) (important|worth|crucial|essential) to (note|remember|recognize|understand)/i, name: '"It\'s important to note" filler', severity: 'high' },
  { pattern: /^(let['']s|let us) (dive|delve|explore|unpack)/i, name: '"Let\'s delve" opener', severity: 'high' },

  // Not-X-But-Y patterns (25% of EQ-Bench slop score)
  { pattern: /not (just|only|merely|simply) [\w\s]+, but (also )?/i, name: '"Not just X, but Y" pattern', severity: 'high' },
  { pattern: /it['']s not about [\w\s]+[,;] it['']s about/i, name: '"It\'s not about X, it\'s about Y"', severity: 'high' },
  { pattern: /more than (just )?[\w\s]+[,;—–-] it['']s/i, name: '"More than X — it\'s Y"', severity: 'medium' },

  // Filler / hedging
  { pattern: /it['']s worth (noting|mentioning|pointing out)/i, name: '"It\'s worth noting" filler', severity: 'medium' },
  { pattern: /at the end of the day/i, name: '"At the end of the day" cliche', severity: 'low' },
  { pattern: /the bottom line is/i, name: '"The bottom line is" cliche', severity: 'low' },
  { pattern: /when it comes to/i, name: '"When it comes to" filler', severity: 'low' },
  { pattern: /at its core/i, name: '"At its core" filler', severity: 'medium' },

  // Conclusion / summary patterns
  { pattern: /in (summary|conclusion|essence|short)/i, name: 'AI summary/conclusion marker', severity: 'medium' },
  { pattern: /to (sum|wrap) (it )?up/i, name: 'AI wrap-up marker', severity: 'low' },

  // Grandiose / empty superlatives
  { pattern: /a testament to/i, name: '"A testament to" — AI superlative', severity: 'high' },
  { pattern: /a (rich |vibrant )?tapestry of/i, name: '"A tapestry of" — AI cliche', severity: 'critical' },
  { pattern: /the (power|beauty|magic|art) of/i, name: '"The power/beauty/magic of"', severity: 'medium' },
  { pattern: /game[- ]?changer/i, name: '"Game-changer" — AI hype', severity: 'medium' },
  { pattern: /a (profound|deep|powerful) sense of/i, name: '"A profound sense of"', severity: 'high' },

  // ChatGPT-style politeness
  { pattern: /great question/i, name: '"Great question!" — chatbot response', severity: 'critical' },
  { pattern: /i['']d be happy to help/i, name: '"I\'d be happy to help" — chatbot', severity: 'critical' },
  { pattern: /i hope (this|that) helps/i, name: '"I hope this helps" — chatbot', severity: 'critical' },
  { pattern: /absolutely[!.]? (here|let)/i, name: '"Absolutely! Here..." — chatbot', severity: 'high' },

  // Formulaic thought-leadership
  { pattern: /here['']s (the thing|what .+ don['']t|why)/i, name: 'Formulaic "Here\'s the thing"', severity: 'low' },
  { pattern: /let that sink in/i, name: '"Let that sink in" — engagement bait', severity: 'medium' },
  { pattern: /this is (huge|massive|a big deal)/i, name: 'Hype filler', severity: 'low' },
];

const SLOP_TRIGRAMS = [
  'a testament to',
  'a tapestry of',
  'it is imperative',
  'it is crucial',
  'it is important',
  'it is worth',
  'in this regard',
  'in this context',
  'plays a crucial',
  'plays a pivotal',
  'serves as a',
  'stands as a',
  'a beacon of',
  'a cornerstone of',
  'a catalyst for',
  'poised to revolutionize',
  'the intersection of',
  'at the forefront',
  'a myriad of',
  'a plethora of',
  'in an era',
  'the ever-evolving',
  'a profound impact',
  'underscores the importance',
  'navigating the complexities',
  'the fabric of',
  'the landscape of',
  'the realm of',
  'a holistic approach',
  'the intricacies of',
];

export function detectSlop(text) {
  const findings = {
    section_title: 'Negative-feedback risk (Grox)',
    section_description: 'Predicts likelihood of triggering not_interested / block_author / mute_author heads and suppressing banger score.',
    slop_score: 0,
    is_likely_ai: false,
    confidence: 'low',
    slop_words_found: [],
    slop_phrases_found: [],
    slop_trigrams_found: [],
    structural_flags: [],
    issues: [],
    strengths: [],
    suggestions: [],
    breakdown: {
      word_score: 0,
      phrase_score: 0,
      trigram_score: 0,
      structural_score: 0,
    },
  };

  if (!text || text.trim().length === 0) return findings;

  const cleanText = text.trim();
  const lowerText = cleanText.toLowerCase();
  const words = lowerText.split(/\s+/);
  const wordCount = words.length;

  let wordHits = { critical: [], high: [], medium: [] };

  for (const word of SLOP_WORDS_CRITICAL) {
    if (matchesWord(lowerText, word)) {
      wordHits.critical.push(word);
      findings.slop_words_found.push({ word, severity: 'critical' });
    }
  }
  for (const word of SLOP_WORDS_HIGH) {
    if (matchesWord(lowerText, word.toLowerCase())) {
      wordHits.high.push(word);
      findings.slop_words_found.push({ word, severity: 'high' });
    }
  }
  for (const word of SLOP_WORDS_MEDIUM) {
    if (matchesWord(lowerText, word.toLowerCase())) {
      wordHits.medium.push(word);
      findings.slop_words_found.push({ word, severity: 'medium' });
    }
  }

  const rawWordScore =
    wordHits.critical.length * 20 +
    wordHits.high.length * 10 +
    wordHits.medium.length * 5;
  findings.breakdown.word_score = Math.min(100, rawWordScore);

  for (const phrase of SLOP_PHRASES) {
    if (phrase.pattern.test(cleanText)) {
      findings.slop_phrases_found.push({ name: phrase.name, severity: phrase.severity });
    }
  }

  const rawPhraseScore =
    findings.slop_phrases_found.filter((p) => p.severity === 'critical').length * 25 +
    findings.slop_phrases_found.filter((p) => p.severity === 'high').length * 15 +
    findings.slop_phrases_found.filter((p) => p.severity === 'medium').length * 8 +
    findings.slop_phrases_found.filter((p) => p.severity === 'low').length * 4;
  findings.breakdown.phrase_score = Math.min(100, rawPhraseScore);

  for (const trigram of SLOP_TRIGRAMS) {
    if (lowerText.includes(trigram)) {
      findings.slop_trigrams_found.push(trigram);
    }
  }

  const rawTrigramScore = findings.slop_trigrams_found.length * 15;
  findings.breakdown.trigram_score = Math.min(100, rawTrigramScore);

  const semicolonCount = (cleanText.match(/;/g) || []).length;
  if (semicolonCount >= 2) {
    findings.structural_flags.push('Multiple semicolons — rare in human tweets, common in AI');
    findings.breakdown.structural_score += 10;
  }

  const emDashCount = (cleanText.match(/[—–]/g) || []).length;
  if (emDashCount >= 3) {
    findings.structural_flags.push('Excessive em-dashes — AI overuses these for dramatic pauses');
    findings.breakdown.structural_score += 8;
  }

  const colonCount = (cleanText.match(/:/g) || []).length;
  if (colonCount >= 3) {
    findings.structural_flags.push('Multiple colons — AI list/explanation pattern');
    findings.breakdown.structural_score += 8;
  }

  const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  if (sentences.length >= 3) {
    const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = avgLen > 0 ? stdDev / avgLen : 0;

    if (coeffOfVariation < 0.15 && wordCount > 20) {
      findings.structural_flags.push(`Very uniform sentence lengths (CV: ${coeffOfVariation.toFixed(2)}) — low burstiness, typical of AI`);
      findings.breakdown.structural_score += 12;
    }
  }

  if (/^\s*[\d]+[.)]\s/m.test(cleanText) || /^\s*[-•]\s/m.test(cleanText)) {
    if (sentences.length <= 2) {
      const listItems = cleanText.match(/^\s*[\d]+[.)]\s/gm) || cleanText.match(/^\s*[-•]\s/gm) || [];
      if (listItems.length >= 3) {
        findings.structural_flags.push('Formatted list in tweet — AI formatting bleed');
        findings.breakdown.structural_score += 10;
      }
    }
  }

  const numberEmojis = cleanText.match(/[\d]️⃣/g) || [];
  if (numberEmojis.length >= 3) {
    findings.structural_flags.push('Number emoji list format — common in AI-generated threads');
    findings.breakdown.structural_score += 5;
  }

  const sentenceAdverbs = sentences.filter((s) =>
    /^\s*(Moreover|Furthermore|Additionally|Consequently|Subsequently|Notably|Importantly|Essentially|Fundamentally|Interestingly|Remarkably|Ultimately)/i.test(s)
  );
  if (sentenceAdverbs.length >= 2) {
    findings.structural_flags.push(`${sentenceAdverbs.length} sentences start with transition adverbs — AI stacking pattern`);
    findings.breakdown.structural_score += 15;
  }

  const participialOpeners = sentences.filter((s) =>
    /^\s*(leveraging|harnessing|utilizing|navigating|embracing|fostering|showcasing|highlighting|emphasizing|having \w+ed|building on|drawing from)/i.test(s.trim())
  );
  if (participialOpeners.length >= 1) {
    findings.structural_flags.push('Participial phrase opener — AI uses these at 2-5x human rate');
    findings.breakdown.structural_score += 8;
  }

  if (/from \w[\w\s]+ to \w[\w\s]+/i.test(cleanText) && /from/.test(lowerText)) {
    const fromToMatches = cleanText.match(/from [\w\s]+ to [\w\s]+/gi) || [];
    if (fromToMatches.length >= 1 && fromToMatches.some((m) => m.split(/\s+/).length >= 5)) {
      findings.structural_flags.push('"From X to Y" construction — common AI enumeration pattern');
      findings.breakdown.structural_score += 5;
    }
  }

  const hiddenChars = cleanText.match(/[\u200B\u200C\u200D\uFEFF]/g) || [];
  if (hiddenChars.length > 0) {
    findings.structural_flags.push(`Hidden Unicode characters detected (${hiddenChars.length}) — possible copy-paste from AI tool`);
    findings.breakdown.structural_score += 10;
  }

  const positiveSuperlatives = (cleanText.match(/\b(amazing|incredible|remarkable|extraordinary|fantastic|wonderful|brilliant|magnificent|outstanding|exceptional)\b/gi) || []).length;
  if (positiveSuperlatives >= 3) {
    findings.structural_flags.push(`${positiveSuperlatives} positive superlatives — AI defaults to excessive agreeableness`);
    findings.breakdown.structural_score += 8;
  }

  findings.breakdown.structural_score = Math.min(100, findings.breakdown.structural_score);

  const baseScore =
    findings.breakdown.word_score * 0.60 +
    findings.breakdown.phrase_score * 0.25 +
    findings.breakdown.trigram_score * 0.15;

  const structuralBonus = findings.breakdown.structural_score * 0.20;

  findings.slop_score = Math.round(Math.min(100, baseScore + structuralBonus));

  if (findings.slop_score >= 50) {
    findings.is_likely_ai = true;
    findings.confidence = 'high';
  } else if (findings.slop_score >= 25) {
    findings.is_likely_ai = true;
    findings.confidence = 'medium';
  } else if (findings.slop_score >= 10) {
    findings.is_likely_ai = false;
    findings.confidence = 'low';
  }

  if (findings.slop_score >= 50) {
    findings.issues.push({
      severity: 'critical',
      message: `High AI slop score (${findings.slop_score}/100). This tweet reads like AI-generated content and will likely trigger negative engagement signals (blocks, mutes, "not interested") which carry weights of -74 to -369 in the algorithm.`,
    });
  } else if (findings.slop_score >= 25) {
    findings.issues.push({
      severity: 'high',
      message: `Moderate AI slop score (${findings.slop_score}/100). Several AI writing patterns detected. Users increasingly disengage from AI-sounding content.`,
    });
  } else if (findings.slop_score >= 10) {
    findings.issues.push({
      severity: 'medium',
      message: `Mild AI signals detected (${findings.slop_score}/100). A few AI-typical patterns found — easy to fix.`,
    });
  } else {
    findings.strengths.push(`Low slop score (${findings.slop_score}/100) — reads like authentic human writing.`);
  }

  if (findings.slop_words_found.length > 0) {
    const critWords = findings.slop_words_found.filter((w) => w.severity === 'critical');
    if (critWords.length > 0) {
      findings.issues.push({
        severity: 'high',
        message: `AI red-flag words detected: "${critWords.map((w) => w.word).join('", "')}". The word "delve" alone saw ~1000% usage increase post-ChatGPT.`,
      });
      findings.suggestions.push(
        `Replace AI-flagged words: ${critWords.map((w) => `"${w.word}"`).join(', ')}. Use simpler, more natural alternatives.`
      );
    }

    const highWords = findings.slop_words_found.filter((w) => w.severity === 'high');
    if (highWords.length > 0) {
      findings.suggestions.push(
        `Consider replacing: ${highWords.map((w) => `"${w.word}"`).join(', ')} — these are statistically overrepresented in AI text.`
      );
    }
  }

  if (findings.slop_phrases_found.length > 0) {
    const topPhrases = findings.slop_phrases_found.slice(0, 3);
    findings.suggestions.push(
      `Remove AI phrase patterns: ${topPhrases.map((p) => p.name).join(', ')}. Rewrite in your own voice.`
    );
  }

  if (findings.structural_flags.length > 0) {
    findings.suggestions.push(
      'Fix structural AI tells: ' + findings.structural_flags[0] + '.'
    );
  }

  if (findings.slop_score >= 10) {
    findings.suggestions.push(
      'Write like you talk. Use contractions, casual language, and imperfect grammar. Real tweets have personality — AI slop doesn\'t.'
    );
    findings.suggestions.push(
      'The X algorithm tracks SlopAuthorScore. Repeated AI-sounding posts can flag your entire account, reducing reach on ALL your tweets.'
    );
  }

  if (findings.slop_score === 0 && findings.slop_words_found.length === 0) {
    findings.strengths.push('No AI slop patterns detected — your tweet sounds authentically human.');
  }

  return findings;
}

function matchesWord(text, word) {
  const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
  return regex.test(text);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const SLOP_REPLACEMENTS = {
  delve: ['dig into', 'explore', 'look at', 'get into'],
  tapestry: ['mix', 'blend', 'collection'],
  multifaceted: ['complex', 'varied', 'many-sided'],
  comprehensive: ['complete', 'full', 'thorough'],
  intricate: ['complex', 'detailed', 'tricky'],
  meticulous: ['careful', 'precise', 'thorough'],
  testament: ['proof', 'sign', 'evidence'],
  pivotal: ['key', 'important', 'crucial'],
  robust: ['strong', 'solid', 'reliable'],
  unprecedented: ['never before seen', 'first-ever', 'new'],
  unparalleled: ['unmatched', 'best', 'top'],
  leverage: ['use', 'apply', 'take advantage of'],
  revolutionize: ['change', 'transform', 'shake up'],
  groundbreaking: ['new', 'innovative', 'first'],
  transformative: ['big', 'game-changing', 'major'],
  holistic: ['complete', 'whole', 'full-picture'],
  synergy: ['teamwork', 'combo', 'working together'],
  harness: ['use', 'tap into', 'put to work'],
  navigate: ['deal with', 'handle', 'work through'],
  beacon: ['example', 'guide', 'light'],
  cornerstone: ['foundation', 'base', 'core'],
  catalyst: ['trigger', 'spark', 'driver'],
  empower: ['enable', 'help', 'give power to'],
  foster: ['build', 'grow', 'encourage'],
  showcasing: ['showing', 'highlighting', 'featuring'],
  landscape: ['space', 'field', 'scene'],
  realm: ['area', 'field', 'world'],
  crucial: ['key', 'important', 'critical'],
  endeavor: ['effort', 'attempt', 'project'],
  paramount: ['top', 'most important', 'key'],
  cultivate: ['build', 'grow', 'develop'],
  facilitate: ['help', 'make easier', 'enable'],
  optimize: ['improve', 'fine-tune', 'make better'],
  streamline: ['simplify', 'speed up', 'clean up'],
};
