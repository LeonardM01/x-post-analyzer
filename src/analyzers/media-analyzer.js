/**
 * Media Analyzer - Evaluates media attachments and their impact on algorithm scoring
 * Based on Twitter algorithm media handling signals
 */

import { OPTIMAL_TWEET } from '../algorithm-weights.js';

/**
 * Analyze media context provided with the tweet
 */
export function analyzeMedia(options = {}) {
  const findings = {
    score: 0,
    has_image: options.hasImage || false,
    has_video: options.hasVideo || false,
    has_gif: options.hasGif || false,
    has_poll: options.hasPoll || false,
    has_media: false,
    issues: [],
    strengths: [],
    suggestions: [],
    boost_factor: 1.0,
  };

  findings.has_media = findings.has_image || findings.has_video || findings.has_gif || findings.has_poll;

  if (findings.has_video) {
    findings.boost_factor = OPTIMAL_TWEET.media.video_boost;
    findings.score = 25;
    findings.strengths.push(
      `Video content gets ~${OPTIMAL_TWEET.media.video_boost}x engagement boost. The algorithm tracks 50% watch-through rate.`
    );
    findings.suggestions.push('Keep videos under 60 seconds for best completion rates.');
    findings.suggestions.push('Add captions - most users browse with sound off.');
    findings.suggestions.push('Hook viewers in the first 3 seconds to boost watch-through.');
  } else if (findings.has_image) {
    findings.boost_factor = OPTIMAL_TWEET.media.image_boost;
    findings.score = 20;
    findings.strengths.push(
      `Image content gets ~${OPTIMAL_TWEET.media.image_boost}x engagement boost over text-only tweets.`
    );
    findings.suggestions.push('Use high-contrast, eye-catching images that stop the scroll.');
    findings.suggestions.push('Infographics and screenshots of text perform especially well.');
  } else if (findings.has_gif) {
    findings.boost_factor = 1.5;
    findings.score = 15;
    findings.strengths.push('GIF content adds visual appeal and boosts engagement.');
  } else if (findings.has_poll) {
    findings.boost_factor = 1.8;
    findings.score = 22;
    findings.strengths.push(
      'Polls drive high engagement - voting counts as interaction and keeps users on-platform.'
    );
  } else {
    findings.boost_factor = OPTIMAL_TWEET.media.no_media_penalty;
    findings.score = 0;
    findings.issues.push({
      severity: 'medium',
      message: `No media attached. Text-only tweets get ~${((1 - OPTIMAL_TWEET.media.no_media_penalty) * 100).toFixed(0)}% less reach.`,
    });
    findings.suggestions.push('Add an image, video, or poll to boost engagement by 2-2.5x.');
    findings.suggestions.push('Even a simple screenshot or relevant image significantly helps.');
  }

  return findings;
}
