/**
 * Main Tweet Analyzer - Orchestrates all analysis modules
 * Combines text, media, timing, engagement, and reply strategy analysis
 */

import { analyzeText } from './analyzers/text-analyzer.js';
import { analyzeMedia } from './analyzers/media-analyzer.js';
import { analyzeTiming } from './analyzers/timing-analyzer.js';
import { predictEngagement } from './analyzers/engagement-predictor.js';
import { analyzeReplyStrategy } from './analyzers/reply-strategy-analyzer.js';
import { detectSlop } from './analyzers/slop-detector.js';
import { LEGACY_2023_WEIGHTS } from './algorithm-weights.js';

/**
 * Run complete analysis on a tweet
 *
 * @param {Object} tweet - Tweet object
 * @param {string} tweet.text - Tweet text content
 * @param {Object} [tweet.media] - Media options { hasImage, hasVideo, hasGif, hasPoll }
 * @param {string} [tweet.postDate] - ISO date string of when the tweet was/will be posted
 * @returns {Object} Complete analysis results
 */
export function analyzeTweet(tweet) {
  const { text, media = {}, postDate = null } = tweet;

  // Run all analyzers
  const textAnalysis = analyzeText(text);
  const mediaAnalysis = analyzeMedia(media);
  const timingAnalysis = analyzeTiming(postDate);
  const replyStrategy = analyzeReplyStrategy(text);
  const slopAnalysis = detectSlop(text);
  const engagementPrediction = predictEngagement(textAnalysis, mediaAnalysis);

  // Calculate overall score (weighted combination)
  const overallScore = calculateOverallScore({
    textAnalysis,
    mediaAnalysis,
    timingAnalysis,
    replyStrategy,
    engagementPrediction,
    slopAnalysis,
  });

  // Compile all issues, strengths, and suggestions
  const allIssues = [
    ...slopAnalysis.issues.map((i) => ({ ...i, source: 'AI Slop' })),
    ...textAnalysis.issues.map((i) => ({ ...i, source: 'Text' })),
    ...mediaAnalysis.issues.map((i) => ({ ...i, source: 'Media' })),
    ...timingAnalysis.issues.map((i) => ({ ...i, source: 'Timing' })),
    ...replyStrategy.issues.map((i) => ({ ...i, source: 'Reply Strategy' })),
  ].sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));

  const allStrengths = [
    ...slopAnalysis.strengths.map((s) => ({ message: s, source: 'AI Slop' })),
    ...textAnalysis.strengths.map((s) => ({ message: s, source: 'Text' })),
    ...mediaAnalysis.strengths.map((s) => ({ message: s, source: 'Media' })),
    ...timingAnalysis.strengths.map((s) => ({ message: s, source: 'Timing' })),
    ...replyStrategy.strengths.map((s) => ({ message: s, source: 'Reply Strategy' })),
  ];

  const allSuggestions = [
    ...slopAnalysis.suggestions.map((s) => ({ message: s, source: 'AI Slop', priority: 'high' })),
    ...textAnalysis.suggestions.map((s) => ({ message: s, source: 'Text', priority: 'medium' })),
    ...mediaAnalysis.suggestions.map((s) => ({ message: s, source: 'Media', priority: 'medium' })),
    ...timingAnalysis.suggestions.map((s) => ({ message: s, source: 'Timing', priority: 'low' })),
    ...replyStrategy.suggestions.map((s) => ({ message: s, source: 'Reply Strategy', priority: 'high' })),
  ];

  // Sort suggestions: reply strategy first (highest impact)
  allSuggestions.sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));

  return {
    overall_score: overallScore.score,
    overall_grade: overallScore.grade,
    summary: overallScore.summary,
    tweet_text: text,
    analysis: {
      text: textAnalysis,
      media: mediaAnalysis,
      timing: timingAnalysis,
      reply_strategy: replyStrategy,
      slop: slopAnalysis,
      engagement_prediction: engagementPrediction,
    },
    issues: allIssues,
    strengths: allStrengths,
    suggestions: allSuggestions,
    algorithm_weights: LEGACY_2023_WEIGHTS,
    analyzed_at: new Date().toISOString(),
  };
}

/**
 * Analyze multiple tweets and compare them
 */
export function compareTweets(tweets) {
  const results = tweets.map((tweet, index) => ({
    index: index + 1,
    ...analyzeTweet(tweet),
  }));

  results.sort((a, b) => b.overall_score - a.overall_score);

  return {
    ranked_tweets: results,
    best: results[0],
    recommendation: `Tweet #${results[0].index} is predicted to perform best with a score of ${results[0].overall_score}/100.`,
  };
}

function calculateOverallScore({ textAnalysis, mediaAnalysis, timingAnalysis, replyStrategy, engagementPrediction, slopAnalysis }) {
  // Weighted combination favoring reply strategy (most impact on algorithm)
  const weights = {
    text: 0.20,
    media: 0.12,
    timing: 0.08,
    reply_strategy: 0.25,
    engagement: 0.15,
    slop_penalty: 0.20,     // AI slop is a major negative signal
  };

  const textScore = textAnalysis.score;
  const mediaScore = mediaAnalysis.score * (100 / 25); // Normalize to 0-100
  const timingScore = timingAnalysis.score * (100 / 15); // Normalize to 0-100
  const replyScore = replyStrategy.reply_score;
  const engagementScore = Math.min(100, engagementPrediction.total_positive_score * 100);
  // Invert slop score: high slop = low score for this component
  const slopScore = 100 - slopAnalysis.slop_score;

  const raw =
    textScore * weights.text +
    mediaScore * weights.media +
    timingScore * weights.timing +
    replyScore * weights.reply_strategy +
    engagementScore * weights.engagement +
    slopScore * weights.slop_penalty;

  const score = Math.round(Math.max(0, Math.min(100, raw)));

  let grade, summary;
  if (score >= 80) {
    grade = 'A';
    summary = 'Excellent - This tweet is well-optimized for the algorithm. High reach potential.';
  } else if (score >= 65) {
    grade = 'B';
    summary = 'Good - Solid tweet with room for improvement. Should get decent engagement.';
  } else if (score >= 45) {
    grade = 'C';
    summary = 'Average - This tweet will get standard distribution. See suggestions to improve.';
  } else if (score >= 25) {
    grade = 'D';
    summary = 'Below Average - Multiple issues detected that will limit reach. Address the issues listed.';
  } else {
    grade = 'F';
    summary = 'Poor - This tweet has significant problems that will severely limit distribution.';
  }

  return { score, grade, summary };
}

function severityOrder(severity) {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return order[severity] ?? 4;
}

function priorityOrder(priority) {
  const order = { high: 0, medium: 1, low: 2 };
  return order[priority] ?? 3;
}
