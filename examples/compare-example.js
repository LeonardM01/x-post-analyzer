/**
 * Example: Compare multiple tweet versions
 */

import { compareTweets, generateComparisonReport } from '../src/index.js';
import { writeFileSync } from 'fs';

// Compare different versions of the same idea
const tweets = [
  {
    text: 'Just launched our new product!',
    media: {},
  },
  {
    text: 'Just launched our new product! Check it out: https://example.com',
    media: {},
  },
  {
    text: `We just launched something we've been working on for 6 months.

It solves the #1 problem our users complained about.

But I'm curious - what's the biggest pain point YOU deal with daily?

Reply and I'll tell you if we solved it 👇`,
    media: { hasImage: true },
  },
];

const comparison = compareTweets(tweets);
const report = generateComparisonReport(comparison);

writeFileSync('comparison-report.md', report);

console.log('Ranking:');
comparison.ranked_tweets.forEach((t, i) => {
  console.log(`  ${i + 1}. Tweet #${t.index} - ${t.overall_score}/100 (${t.overall_grade})`);
});
console.log(`\n${comparison.recommendation}`);
console.log(`\nReport saved to comparison-report.md`);
