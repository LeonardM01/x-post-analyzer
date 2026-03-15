/**
 * Tests for x-post-analyzer
 */

import { analyzeTweet, compareTweets } from '../src/analyzer.js';
import { generateReport } from '../src/report/markdown-report.js';
import { analyzeText } from '../src/analyzers/text-analyzer.js';
import { analyzeReplyStrategy } from '../src/analyzers/reply-strategy-analyzer.js';

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
  assert(result.overall_score < 30, 'Empty tweet scores poorly');
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
  assert(report.includes('## Action Steps to Improve'), 'Report has suggestions');
  assert(report.includes('## Quick Checklist'), 'Report has checklist');
}

console.log('');
console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
