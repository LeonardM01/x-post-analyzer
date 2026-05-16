import { OPTIMAL_TWEET } from '../algorithm-weights.js';

const PHOTO_EXPAND_CUES = [
  /see below/i,
  /swipe/i,
  /look closely/i,
  /details in (image|photo|pic)/i,
  /zoom in/i,
  /tap (to|for)/i,
  /full (image|chart|graph|breakdown) (below|here)/i,
  /can you spot/i,
  /what do you see/i,
];

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
      `Video content gets ~${OPTIMAL_TWEET.media.video_boost}x engagement boost. The algorithm scores via vqv_score (video quality view), gated by MIN_VIDEO_DURATION_MS. video_watch_time is a continuous head that rewards retention throughout playback.`
    );
    findings.suggestions.push('Keep videos under 60 seconds for best completion rates.');
    findings.suggestions.push('Add captions - most users browse with sound off.');
    findings.suggestions.push('Hook viewers in the first 3 seconds to boost watch-through and vqv_score.');
  } else if (findings.has_image) {
    findings.boost_factor = OPTIMAL_TWEET.media.image_boost;
    findings.score = 20;

    const tweetText = options.tweetText || '';
    const hasExpandCue = PHOTO_EXPAND_CUES.some((p) => p.test(tweetText));
    if (hasExpandCue) {
      findings.score += 2;
      findings.strengths.push(
        `Image content gets ~${OPTIMAL_TWEET.media.image_boost}x engagement boost. Text suggests tap-to-expand affordance — small positive bonus on photo_expand_score.`
      );
    } else {
      findings.strengths.push(
        `Image content gets ~${OPTIMAL_TWEET.media.image_boost}x engagement boost over text-only tweets.`
      );
      findings.suggestions.push('Add a tap-to-expand cue ("see below", "zoom in", "details in image") to boost photo_expand_score.');
    }
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
