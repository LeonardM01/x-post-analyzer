#!/usr/bin/env node

/**
 * x-post-analyzer CLI
 * Analyze X/Twitter posts from the command line
 *
 * Usage:
 *   node src/cli.js "Your tweet text here"
 *   node src/cli.js --file tweets.txt
 *   node src/cli.js --image "Tweet text with image"
 *   node src/cli.js --video "Tweet text with video"
 *   node src/cli.js --poll "Tweet text with poll"
 *   node src/cli.js --compare "Tweet 1" "Tweet 2" "Tweet 3"
 *   node src/cli.js --output report.md "Your tweet text"
 */

import { readFileSync, writeFileSync } from 'fs';
import { analyzeTweet, compareTweets } from './analyzer.js';
import { generateReport, generateComparisonReport } from './report/markdown-report.js';

function parseArgs(args) {
  const options = {
    tweets: [],
    output: null,
    compare: false,
    media: {},
    postDate: null,
    help: false,
    file: null,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--image':
        options.media.hasImage = true;
        break;
      case '--video':
        options.media.hasVideo = true;
        break;
      case '--gif':
        options.media.hasGif = true;
        break;
      case '--poll':
        options.media.hasPoll = true;
        break;
      case '--compare':
        options.compare = true;
        break;
      case '--date':
        options.postDate = args[++i];
        break;
      case '--file':
      case '-f':
        options.file = args[++i];
        break;
      default:
        if (!arg.startsWith('-')) {
          options.tweets.push(arg);
        }
        break;
    }
    i++;
  }

  return options;
}

function printHelp() {
  console.log(`
x-post-analyzer - Analyze X/Twitter posts against the open-source algorithm

USAGE:
  node src/cli.js [options] "Your tweet text here"

OPTIONS:
  -h, --help          Show this help message
  -o, --output FILE   Save report to a markdown file (default: stdout)
  -f, --file FILE     Read tweet(s) from a file (one per line)
  --image             Tweet includes an image
  --video             Tweet includes a video
  --gif               Tweet includes a GIF
  --poll              Tweet includes a poll
  --compare           Compare multiple tweets and rank them
  --date DATE         ISO date string for posting time analysis

EXAMPLES:
  # Analyze a single tweet
  node src/cli.js "Just shipped a new feature! What do you think?"

  # Analyze with image and save report
  node src/cli.js --image -o report.md "Check out this design. What would you change?"

  # Compare multiple tweets
  node src/cli.js --compare "Tweet version 1" "Tweet version 2" "Tweet version 3"

  # Read tweets from file
  node src/cli.js -f tweets.txt --compare -o comparison.md

ALGORITHM WEIGHTS (what matters most):
  Author-engaged Reply:  75.0  (150x a like) - REPLY TO YOUR COMMENTERS!
  Reply:                 13.5  (27x a like)  - Drive conversation
  Profile Click:         12.0  (24x a like)
  Good Click:            11.0  (22x a like)
  Retweet:                1.0  (2x a like)
  Like:                   0.5  (baseline)
  Report:              -369.0  (avoid at all costs)
  Negative Feedback:    -74.0  (avoid spam signals)
`);
}

function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help || (options.tweets.length === 0 && !options.file)) {
    printHelp();
    process.exit(0);
  }

  // Load tweets from file if specified
  if (options.file) {
    try {
      const content = readFileSync(options.file, 'utf-8');
      const fileTweets = content.split('\n').filter((line) => line.trim().length > 0);
      options.tweets.push(...fileTweets);
    } catch (err) {
      console.error(`Error reading file: ${err.message}`);
      process.exit(1);
    }
  }

  let report;

  if (options.compare && options.tweets.length > 1) {
    // Compare mode
    const tweetObjects = options.tweets.map((text) => ({
      text,
      media: options.media,
      postDate: options.postDate,
    }));

    const comparison = compareTweets(tweetObjects);
    report = generateComparisonReport(comparison);

    console.log(`\nRanking:`);
    comparison.ranked_tweets.forEach((t, i) => {
      console.log(`  ${i + 1}. Tweet #${t.index} - Score: ${t.overall_score}/100 (${t.overall_grade})`);
    });
    console.log(`\n${comparison.recommendation}\n`);
  } else {
    // Single tweet analysis
    const tweet = {
      text: options.tweets[0],
      media: options.media,
      postDate: options.postDate,
    };

    const analysis = analyzeTweet(tweet);
    report = generateReport(analysis);

    // Print summary to console
    console.log(`\n  Score: ${analysis.overall_score}/100 (${analysis.overall_grade})`);
    console.log(`  ${analysis.summary}`);
    console.log(`  Reply Potential: ${analysis.analysis.reply_strategy.reply_score}/100`);

    const slopScore = analysis.analysis.slop.slop_score;
    const slopLabel = slopScore === 0 ? 'Clean' : slopScore < 25 ? 'Minor signals' : slopScore < 50 ? 'Moderate' : 'HIGH - rewrite needed';
    console.log(`  AI Slop Score: ${slopScore}/100 (${slopLabel})`);
    if (analysis.analysis.slop.slop_words_found.length > 0) {
      const flagged = analysis.analysis.slop.slop_words_found.slice(0, 5).map((w) => `"${w.word}"`).join(', ');
      console.log(`  AI-flagged words: ${flagged}`);
    }

    if (analysis.issues.length > 0) {
      console.log(`\n  Issues (${analysis.issues.length}):`);
      analysis.issues.slice(0, 5).forEach((issue) => {
        console.log(`    [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
    }

    if (analysis.suggestions.length > 0) {
      console.log(`\n  Top Suggestions:`);
      analysis.suggestions.slice(0, 3).forEach((s, i) => {
        console.log(`    ${i + 1}. ${s.message}`);
      });
    }
    console.log('');
  }

  // Save report
  const outputFile = options.output || 'analysis-report.md';
  writeFileSync(outputFile, report);
  console.log(`  Full report saved to: ${outputFile}\n`);
}

main();
