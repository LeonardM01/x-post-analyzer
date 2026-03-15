/**
 * Twitter/X Algorithm Weights & Signals
 * Source: https://github.com/twitter/the-algorithm
 *         https://github.com/twitter/the-algorithm-ml
 *
 * These weights are extracted directly from the open-source Twitter algorithm.
 * The heavy ranker uses a MaskNet model that predicts engagement probabilities,
 * then combines them using these weights into a final score.
 */

// Heavy Ranker engagement weights (from the-algorithm-ml/projects/home/recap)
// score = sum_i { weight_i * P(engagement_i) }
export const ENGAGEMENT_WEIGHTS = {
  favorited: 0.5,             // Likes - lowest positive weight
  retweeted: 1.0,             // Retweets - 2x a like
  replied: 13.5,              // Replies - 27x a like
  replied_and_engaged_by_author: 75.0,  // Author-engaged replies - 150x a like
  good_profile_click: 12.0,   // Profile clicks from tweet - 24x a like
  good_click: 11.0,           // Good clicks (URL, detail expand) - 22x a like
  video_playback_50: 0.005,   // 50% video watched - near zero
  report: -369.0,             // Reports - massive penalty
  negative_feedback: -74.0,   // "See less often" / mute - heavy penalty
};

// Scaling factors from ScoredTweetsParam.scala
export const SCALE_FACTORS = {
  out_of_network: 0.75,       // OON tweets scaled down 25%
  reply_tweet: 0.75,          // Reply tweets scaled down 25%
  creator_in_network: 1.0,    // In-network creator default
  creator_out_of_network: 1.0,// Out-of-network creator default
  live_content: 1.0,          // Live content default
};

// Author diversity penalty (prevents one author dominating feed)
export const AUTHOR_DIVERSITY = {
  decay_factor: 0.5,          // Each subsequent tweet from same author decays score by 50%
  floor: 0.25,                // Minimum score multiplier (never goes below 25%)
};

// Feedback fatigue scorer thresholds
export const FEEDBACK_FATIGUE = {
  lower_bound: 0.2,           // Minimum multiplier when user gives "See fewer" feedback
  upper_bound: 1.0,           // Maximum multiplier (no feedback)
  time_period_days: 140,      // Discount fades over 140 days
  increment_count: 4,         // 4 steps of recovery
};

// Negative signals from InteractionGraphNegativeJob.scala
export const NEGATIVE_SIGNALS = {
  blocks: { severity: 'critical', description: 'User blocked the author' },
  mutes: { severity: 'critical', description: 'User muted the author' },
  abuse_reports: { severity: 'critical', description: 'Reported as abuse' },
  spam_reports: { severity: 'critical', description: 'Reported as spam' },
  unfollows: { severity: 'moderate', description: 'User unfollowed (90-day window)', window_days: 90 },
};

// Optimal tweet characteristics derived from algorithm analysis
export const OPTIMAL_TWEET = {
  text_length: {
    min: 71,                   // Too short = low engagement signal
    ideal_min: 100,            // Sweet spot start
    ideal_max: 250,            // Sweet spot end (encourages reading + replying)
    max: 280,                  // Character limit
  },
  hashtags: {
    ideal: { min: 0, max: 2 }, // 0-2 hashtags is optimal
    penalty_threshold: 3,      // 3+ hashtags triggers spam-like behavior
  },
  mentions: {
    ideal: { min: 0, max: 1 }, // 0-1 mentions optimal
    penalty_threshold: 3,      // 3+ looks like spam tagging
  },
  urls: {
    ideal: 0,                  // Algorithm de-prioritizes external links
    max_before_penalty: 1,     // More than 1 link is heavily penalized
  },
  media: {
    image_boost: 2.0,          // Images boost engagement ~2x
    video_boost: 2.5,          // Video boosts even more
    no_media_penalty: 0.7,     // Text-only gets ~30% less reach
  },
};

// Reply-bait and engagement patterns the algorithm rewards
export const REPLY_TRIGGERS = {
  question_mark: { boost: 1.3, description: 'Questions drive replies' },
  opinion_statement: { boost: 1.2, description: 'Strong opinions generate debate' },
  call_to_action: { boost: 1.15, description: 'Direct CTAs increase interaction' },
  thread_hook: { boost: 1.1, description: 'Thread starters get more engagement' },
};

// Patterns the algorithm detects as low quality
export const SPAM_SIGNALS = {
  all_caps_ratio: 0.5,        // More than 50% caps = spammy
  excessive_emojis: 5,        // More than 5 emojis per tweet
  excessive_hashtags: 3,      // More than 3 hashtags
  excessive_mentions: 3,      // More than 3 @mentions
  url_only: true,             // Tweets that are just a URL
  duplicate_chars: 3,         // Same char repeated 3+ times (e.g., "!!!!")
};
