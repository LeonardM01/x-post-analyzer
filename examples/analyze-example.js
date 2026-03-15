/**
 * Example: Analyze a single tweet and generate a report
 */

import { analyzeTweet, generateReport } from '../src/index.js';
import { writeFileSync } from 'fs';

// Example tweet to analyze
const tweet = {
  text: `I've been building software for 10 years and here's the one thing nobody tells you:

The best engineers aren't the ones who write the most code. They're the ones who delete the most.

Every line you remove is a line that can't break.

What's the best code you've ever deleted? 👇`,
  media: { hasImage: false },
  postDate: new Date().toISOString(),
};

const analysis = analyzeTweet(tweet);
const report = generateReport(analysis);

// Save report
writeFileSync('example-report.md', report);

console.log(`Score: ${analysis.overall_score}/100 (${analysis.overall_grade})`);
console.log(`Reply Potential: ${analysis.analysis.reply_strategy.reply_score}/100`);
console.log(`\nReport saved to example-report.md`);
