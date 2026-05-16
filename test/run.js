/**
 * Tests for x-post-analyzer
 */

import { analyzeTweet, compareTweets } from '../src/analyzer.js';
import { generateReport } from '../src/report/markdown-report.js';
import { analyzeText } from '../src/analyzers/text-analyzer.js';
import { analyzeReplyStrategy } from '../src/analyzers/reply-strategy-analyzer.js';
import { detectSlop } from '../src/analyzers/slop-detector.js';
import bangerPredictor from '../src/analyzers/banger-predictor.js';
import safetyAnalyzer from '../src/analyzers/safety-analyzer.js';
import { CURRENT_ACTIONS, LEGACY_2023_WEIGHTS } from '../src/algorithm-weights.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

console.log('=== x-post-analyzer Tests ===\n');

// --- Text Analyzer Tests ---
console.log('Text Analyzer:');

{
  const result = analyzeText('Hi');
  assert(result.score < 80, 'Short tweet gets penalized');
  assert(result.issues.length > 0, 'Short tweet has issues');
}

{
  const result = analyzeText('This is a well-crafted tweet that shares a genuine opinion about something important. I think the key insight people miss is that consistency matters more than virality. What do you think?');
  assert(result.score >= 80, 'Good tweet scores well');
  assert(result.strengths.length > 0, 'Good tweet has strengths');
}

{
  const result = analyzeText('#marketing #growth #seo #viral #trending #follow #like #retweet');
  assert(result.issues.some(i => i.message.includes('hashtag')), 'Excessive hashtags detected');
}

{
  const result = analyzeText('Check this out! https://example.com https://another.com https://third.com');
  assert(result.issues.some(i => i.message.includes('URL')), 'Multiple URLs detected');
}

{
  const result = analyzeText('THIS IS ALL CAPS AND LOOKS LIKE SPAM DONT YOU THINK SO');
  assert(result.issues.some(i => i.message.includes('caps')), 'Excessive caps detected');
}

console.log('');

// --- Reply Strategy Tests ---
console.log('Reply Strategy Analyzer:');

{
  const result = analyzeReplyStrategy('Just posted a new blog.');
  assert(result.reply_score < 20, 'Statement without question has low reply score');
  assert(result.hooks_found.length === 0, 'No hooks in plain statement');
}

{
  const result = analyzeReplyStrategy('Hot take: JavaScript is overrated. Change my mind. What do you think?');
  assert(result.reply_score > 50, 'Tweet with hooks has high reply score');
  assert(result.hooks_found.length >= 2, 'Multiple hooks detected');
}

{
  const result = analyzeReplyStrategy('Unpopular opinion: most people don\'t need a framework. Agree or disagree?');
  assert(result.hooks_found.length >= 1, 'Unpopular opinion detected');
  assert(result.debate_triggers_found.length >= 1, 'Debate triggers detected');
}

console.log('');

// --- Full Analysis Tests ---
console.log('Full Analysis:');

{
  const result = analyzeTweet({ text: 'Great tweet with a question. What do you think?', media: { hasImage: true } });
  assert(result.overall_score > 0, 'Analysis returns a score');
  assert(result.overall_grade !== undefined, 'Analysis returns a grade');
  assert(result.issues !== undefined, 'Analysis returns issues');
  assert(result.suggestions !== undefined, 'Analysis returns suggestions');
}

{
  const result = analyzeTweet({ text: '' });
  assert(result.overall_score < 40, 'Empty tweet scores poorly');
}

{
  const result = analyzeTweet({
    text: 'I believe the biggest mistake in tech hiring is optimizing for leetcode skills over real-world problem solving.\n\nMost people get this wrong.\n\nWhat\'s your experience? Agree or disagree?',
    media: { hasImage: true },
  });
  assert(result.overall_score >= 50, 'Well-optimized tweet scores well');
  assert(result.analysis.reply_strategy.reply_score > 30, 'Reply strategy detects hooks');
}

console.log('');

// --- Comparison Tests ---
console.log('Comparison:');

{
  const result = compareTweets([
    { text: 'Just shipped something.' },
    { text: 'Just shipped a major feature that changes how we think about testing. Here\'s what I learned. What\'s your approach to testing? Agree or disagree?', media: { hasImage: true } },
  ]);
  assert(result.ranked_tweets[0].overall_score > result.ranked_tweets[1].overall_score, 'Better tweet ranks higher');
  assert(result.best !== undefined, 'Best tweet identified');
}

console.log('');

// --- AI Slop Detection Tests ---
console.log('AI Slop Detector:');

{
  const result = detectSlop('just shipped a new feature and im pretty hyped about it. what do yall think?');
  assert(result.slop_score < 10, 'Casual human tweet has low slop score');
  assert(result.slop_words_found.length === 0, 'No slop words in casual tweet');
}

{
  const result = detectSlop('Let me delve into this multifaceted tapestry of innovation. It is important to note that this comprehensive and robust framework leverages cutting-edge paradigms.');
  assert(result.slop_score >= 50, 'Heavy AI slop scores high');
  assert(result.slop_words_found.length >= 5, 'Multiple slop words detected');
  assert(result.is_likely_ai === true, 'Flagged as likely AI');
}

{
  const result = detectSlop('In today\'s fast-paced world, it\'s crucial to leverage robust solutions. Not just tools, but comprehensive frameworks that foster innovation.');
  assert(result.slop_phrases_found.length >= 1, 'AI phrases detected');
  assert(result.slop_score >= 25, 'Moderate AI content scores above 25');
}

{
  const result = detectSlop('Great question! I\'d be happy to help. In essence, this is a testament to the power of innovation.');
  assert(result.slop_phrases_found.some(p => p.name.includes('chatbot')), 'Chatbot phrases detected');
  assert(result.slop_score >= 30, 'Chatbot-style content scores high');
}

{
  const result = detectSlop('i mass shipped my side project last night at 2am and honestly its kinda mid but whatever lol');
  assert(result.slop_score < 10, 'Very casual human tweet scores near zero');
  assert(result.is_likely_ai === false, 'Not flagged as AI');
}

{
  const result = detectSlop('the ux is bad. like really bad. fix your onboarding or watch users bounce. nobody wants a 12-step signup in 2025');
  assert(result.slop_score < 10, 'Opinionated human tweet scores near zero');
}

{
  // Test structural detection - uniform sentence lengths
  const result = detectSlop('Moreover, innovation drives growth. Furthermore, collaboration builds trust. Additionally, execution ensures results. Consequently, leadership matters most.');
  assert(result.structural_flags.length >= 1, 'Structural AI patterns detected (adverb stacking)');
}

{
  // Test that slop is integrated into full analysis
  const result = analyzeTweet({ text: 'This robust and comprehensive solution leverages cutting-edge paradigms to revolutionize the landscape.' });
  assert(result.analysis.slop !== undefined, 'Slop analysis present in full analysis');
  assert(result.analysis.slop.slop_score > 0, 'Slop score populated in full analysis');
}

console.log('');

// --- Report Generation Tests ---
console.log('Report Generation:');

{
  const analysis = analyzeTweet({
    text: 'Hot take: the best code is the code you never write. Most people overcomplicate everything. What\'s your take?',
    media: { hasImage: true },
  });
  const report = generateReport(analysis);
  assert(report.includes('# X/Twitter Post Analysis Report'), 'Report has title');
  assert(report.includes('## Overall Score'), 'Report has score section');
  assert(report.includes('## Algorithm Weight Reference'), 'Report has weight reference');
  assert(report.includes('## Reply Strategy Analysis'), 'Report has reply strategy');
  assert(report.includes('Negative-feedback risk (Grox)'), 'Report has negative-feedback risk section');
  assert(report.includes('## Action Steps to Improve'), 'Report has suggestions');
  assert(report.includes('## Quick Checklist'), 'Report has checklist');
}

// --- Algorithm Weights Tests ---
console.log('Algorithm Weights (xalgo 2026):');

{
  const expectedActions = ['favorite', 'reply', 'repost', 'photo_expand', 'click', 'profile_click', 'vqv', 'share', 'share_via_dm', 'share_via_copy_link', 'dwell', 'quote', 'quoted_click', 'follow_author', 'not_interested', 'block_author', 'mute_author', 'report'];
  for (const action of expectedActions) {
    assert(CURRENT_ACTIONS[action] !== undefined, `CURRENT_ACTIONS has key: ${action}`);
  }
}

{
  assert(LEGACY_2023_WEIGHTS.replied_and_engaged_by_author === 75.0, 'Archive guard: legacy replied_and_engaged_by_author === 75.0');
  assert(LEGACY_2023_WEIGHTS.replied === 13.5, 'Archive guard: legacy replied === 13.5');
  assert(LEGACY_2023_WEIGHTS.report === -369.0, 'Archive guard: legacy report === -369.0');
}

{
  assert(CURRENT_ACTIONS.not_interested.category === 'negative', 'not_interested is negative category');
  assert(CURRENT_ACTIONS.block_author.category === 'negative', 'block_author is negative category');
  assert(CURRENT_ACTIONS.mute_author.category === 'negative', 'mute_author is negative category');
  assert(CURRENT_ACTIONS.report.category === 'negative', 'report is negative category');
}

{
  assert(CURRENT_ACTIONS.favorite.current_weight === null, 'current_weight is null (unpublished)');
  assert(CURRENT_ACTIONS.favorite.legacy_2023_weight === 0.5, 'favorite legacy weight is 0.5');
  assert(CURRENT_ACTIONS.reply.legacy_2023_weight === 13.5, 'reply legacy weight is 13.5');
}

{
  const ep = analyzeTweet({ text: 'What do you think about this? Drop your opinion!' }).analysis.engagement_prediction;
  assert(ep.predictions.reply !== undefined, 'engagement prediction has reply key');
  assert(ep.predictions.favorite !== undefined, 'engagement prediction has favorite key');
  assert(ep.predictions.not_interested !== undefined, 'engagement prediction has not_interested key');
  assert(ep.predictions.follow_author !== undefined, 'engagement prediction has follow_author key');
  assert(ep.predictions.vqv !== undefined, 'engagement prediction has vqv key');
}

// --- Text Analyzer Length / Dwell-time framing ---
console.log('Text Analyzer (dwell-time framing):');

{
  const result = analyzeText('Short');
  assert(result.issues.some(i => i.message.includes('dwell')), '50-char tweet flagged with dwell-time framing');
}

{
  const result = analyzeText('A'.repeat(50));
  assert(result.score < 80, '50-char tweet penalized as too short');
  assert(result.issues.length > 0, '50-char tweet has issues');
}

{
  const result = analyzeText('A'.repeat(300));
  assert(result.issues.some(i => i.message.includes('Long tweet') || i.severity === 'low'), '300-char tweet flagged as too long');
}

console.log('');

// --- Reply Strategy: no 75.0 or 150x ---
console.log('Reply Strategy (xalgo 2026 framing):');

{
  const result = analyzeReplyStrategy('What do you think about this?');
  const allText = JSON.stringify(result);
  assert(!allText.includes('75.0'), 'Reply strategy output does not contain 75.0');
  assert(!allText.includes('150x'), 'Reply strategy output does not contain 150x');
}

console.log('');

// --- Banger Predictor Tests ---
console.log('Banger Predictor:');

{
  const result = bangerPredictor('5 brutal truths nobody in tech talks about. I found this out the hard way in 2026.');
  assert(result.isBanger === true, 'Tweet with strong hook + specificity is a banger');
  assert(result.score >= 0.4, 'Banger score meets threshold');
  assert(typeof result.factors.novelty === 'number', 'Returns novelty factor');
}

{
  const result = bangerPredictor("game changer here's why take notes bookmark this let that sink in mind blown thread below");
  assert(result.isBanger === false, 'Cliche-heavy tweet is not a banger');
  assert(result.factors.clicheDensity < 0.3, 'Cliche density is heavily penalized');
}

console.log('');

// --- Safety Analyzer Tests ---
console.log('Safety Analyzer:');

{
  const result = safetyAnalyzer('follow for follow! earn $500 a day, click here, drop your link below free followers giveaway follow');
  const spamCat = result.find((c) => c.categoryId === 'spam');
  assert(spamCat !== undefined, 'Spam category present');
  assert(spamCat.risk !== 'low', 'Spam tweet triggers non-low spam risk');
}

{
  const result = safetyAnalyzer('Just shipped a new feature. What do you think? Hot take: most devs over-engineer their first SaaS.');
  const allLow = result.every((c) => c.risk === 'low');
  assert(allLow === true, 'Clean tweet — all categories are low risk');
}

{
  const result = safetyAnalyzer('some random tweet');
  assert(Array.isArray(result), 'Returns array');
  assert(result.length === 7, 'Returns all 7 Grox categories');
  assert(result[0].categoryId !== undefined, 'Each result has categoryId');
  assert(result[0].deluxeReasoningApplied !== undefined, 'Each result has deluxeReasoningApplied');
}

console.log('');
console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
