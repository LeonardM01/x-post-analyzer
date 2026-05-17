/**
 * x-post-analyzer - Analyze X/Twitter posts against the open-source algorithm
 *
 * Based on: https://github.com/twitter/the-algorithm
 *           https://github.com/twitter/the-algorithm-ml
 */

export { analyzeTweet, compareTweets } from './analyzer.js';
export { isEnabled as isGrokEnabled } from './grok/client.js';
export { generateReport, generateComparisonReport } from './report/markdown-report.js';
export { CURRENT_ACTIONS, CONTINUOUS_ACTIONS, LEGACY_2023_WEIGHTS, GROX_SAFETY_CATEGORIES, OPTIMAL_TWEET, SPAM_SIGNALS, NEGATIVE_SIGNALS } from './algorithm-weights.js';
export { default as bangerPredictor } from './analyzers/banger-predictor.js';
export { default as safetyAnalyzer } from './analyzers/safety-analyzer.js';
export { analyzeText } from './analyzers/text-analyzer.js';
export { analyzeMedia } from './analyzers/media-analyzer.js';
export { analyzeTiming } from './analyzers/timing-analyzer.js';
export { predictEngagement } from './analyzers/engagement-predictor.js';
export { analyzeReplyStrategy } from './analyzers/reply-strategy-analyzer.js';
export { detectSlop, SLOP_REPLACEMENTS } from './analyzers/slop-detector.js';
