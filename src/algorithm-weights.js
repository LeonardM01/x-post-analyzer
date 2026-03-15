/**
 * Twitter/X Algorithm Weights & Signals
 * Source: https://github.com/twitter/the-algorithm
 *         https://github.com/twitter/the-algorithm-ml
 *
 * The heavy ranker uses a MaskNet multi-task model with 15 engagement prediction
 * heads. Each head predicts the probability of a specific engagement type.
 * The final score is: score = sum_i { weight_i * P(engagement_i) }
 *
 * NOTE: Default weights in the source code are 0.0 — production weights are injected
 * at runtime via Feature Switch. The weights below are from the-algorithm-ml README
 * (published April 2023) which documented the actual production calibration.
 *
 * Source files:
 *   - PredictedScoreFeature.scala (15 engagement heads)
 *   - HomeGlobalParams.scala (weight params)
 *   - RerankerUtil.scala (score aggregation formula)
 *   - HeuristicScorer.scala (rescoring pipeline)
 *   - RescoringFactorProvider.scala (all rescoring factors)
 */

// Heavy Ranker engagement weights (from the-algorithm-ml/projects/home/recap)
// Production calibration from README (April 5, 2023)
// score = sum_i { weight_i * P(engagement_i) }
export const ENGAGEMENT_WEIGHTS = {
  favorited: 0.5,             // Likes - lowest positive weight
  retweeted: 1.0,             // Retweets - 2x a like
  replied: 13.5,              // Replies - 27x a like
  replied_and_engaged_by_author: 75.0,  // Author-engaged replies - 150x a like
  good_profile_click: 12.0,   // Profile clicks from tweet - 24x a like
  good_click: 11.0,           // Good clicks (URL, detail expand) - 22x a like
  video_playback_50: 0.005,   // 50% video watched - near zero
  report: -369.0,             // Reports - massive penalty (bounded: -20000 to 0)
  negative_feedback: -74.0,   // "See less often" (bounded: -1000 to 0)
};

// All 15 engagement prediction heads from the Heavy Ranker (PredictedScoreFeature.scala)
// These are the actual model outputs the algorithm predicts per tweet
export const ALL_PREDICTION_HEADS = {
  favorited: 'PredictedFavoriteScoreFeature',
  retweeted: 'PredictedRetweetScoreFeature',
  replied: 'PredictedReplyScoreFeature',
  replied_and_engaged_by_author: 'PredictedReplyEngagedByAuthorScoreFeature',
  good_click_v1: 'PredictedGoodClickConvoDescFavoritedOrRepliedScoreFeature',
  good_click_v2: 'PredictedGoodClickConvoDescUamGt2ScoreFeature',
  good_profile_click: 'PredictedGoodProfileClickScoreFeature',
  video_quality_view: 'PredictedVideoQualityViewScoreFeature',          // Videos only
  video_quality_view_immersive: 'PredictedVideoQualityViewImmersiveScoreFeature',
  bookmark: 'PredictedBookmarkScoreFeature',
  share: 'PredictedShareScoreFeature',
  dwell: 'PredictedDwellScoreFeature',                                  // Mutually exclusive with VQV for videos
  video_quality_watch: 'PredictedVideoQualityWatchScoreFeature',        // Videos >= 10s only
  video_watch_time: 'PredictedVideoWatchTimeScoreFeature',
  negative_feedback_v2: 'PredictedNegativeFeedbackV2ScoreFeature',
};

// Heuristic rescoring factors (from HeuristicScorer.scala / RescoringFactorProvider.scala)
// These are multiplicative - all factors are multiplied together
export const SCALE_FACTORS = {
  out_of_network: 0.75,       // OON tweets scaled down 25% (RescoreOutOfNetwork)
  reply_tweet: 0.75,          // Reply tweets scaled down 25% (RescoreReplies)
  creator_in_network: 1.0,    // In-network creator default (range 0-100)
  creator_out_of_network: 1.0,// Out-of-network creator default (range 0-100)
  live_content: 1.0,          // Live content default (max 10000, in-network >1M followers)
  control_ai_show_less: 0.05, // "Show Less" from AI: 95% reduction
  control_ai_show_more: 20.0, // "Show More" from AI: 20x boost
};

// Author diversity penalty (prevents one author dominating feed)
// From AuthorBasedListwiseRescoringProvider.scala
// factor = (1 - floor) * decayFactor^index + floor
// 1st tweet: 1.0, 2nd: 0.625, 3rd: 0.4375
export const AUTHOR_DIVERSITY = {
  decay_factor: 0.5,          // Each subsequent tweet from same author decays score by 50%
  floor: 0.25,                // Minimum score multiplier (never goes below 25%)
  small_follow_graph_threshold: 50, // Different params for users following <= 50
};

// Impressed author decay (separate from diversity)
// Considers how many of an author's tweets the viewer has already been shown
export const IMPRESSED_AUTHOR_DECAY = {
  in_network: { decay: 0.5, floor: 0.25 },
  out_of_network: { decay: 0.5, floor: 0.25 },
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
  blocks: { severity: 'critical', description: 'User blocked the author — tweet completely removed' },
  mutes: { severity: 'critical', description: 'User muted the author — tweet completely removed' },
  blocked_by: { severity: 'critical', description: 'Author blocks viewer — tweet completely removed' },
  abuse_reports: { severity: 'critical', description: 'Reported as abuse' },
  spam_reports: { severity: 'critical', description: 'Reported as spam' },
  unfollows: { severity: 'moderate', description: 'User unfollowed (90-day window)', window_days: 90 },
};

// Grok content quality signals (content safety filters from ScoredTweetsRecommendationPipelineConfig)
export const CONTENT_QUALITY_FILTERS = {
  gore: 'GrokGoreFilter',
  nsfw: 'GrokNsfwFilter',
  spam: 'GrokSpamFilter',
  violent: 'GrokViolentFilter',
  slop: 'SlopFilter',                  // Low quality AI content
  out_of_network_nsfw: 'OutOfNetworkNSFW',
};

// Two-tier AI Slop Detection System (from source code analysis)
// Tier 1: Author-level (SlopAuthorFeatureHydrator.scala + SlopFilter.scala)
// Tier 2: Content-level (GrokAnnotationsFeatureHydrator.scala + GrokSlopScoreRescorer.scala)
export const SLOP_SYSTEM = {
  // Tier 1: Author-level slop detection
  author: {
    max_score: 0.3,               // SlopMaxScore: authors above 0.3 flagged as slop (range 0.0-4.0)
    min_followers: 100,           // SlopMinFollowers: only filters authors with 100+ followers
    min_following_threshold: 5,   // Bypassed if user follows 5+ slop authors
    // Targets: NearZero, New, VeryLight users + low-signal users
    // Only filters OUT-OF-NETWORK tweets from flagged authors
    source_file: 'SlopAuthorFeatureHydrator.scala',
    // Uses NsfwConsumerFollowerScore from abuse detection system
  },
  // Tier 2: Content-level Grok slop scoring
  content: {
    tiers: {
      1: 'Low slop',              // GrokSlopScore = 1
      2: 'Medium slop',           // GrokSlopScore = 2
      3: 'High slop — triggers decay', // GrokSlopScore = 3 (treatmentValue)
    },
    decay_value: 1.0,             // GrokSlopScoreDecayValueParam default (range 0.0-1.0)
                                  // At 1.0 = no penalty; lower = stronger penalty
    source_file: 'GrokSlopScoreRescorer.scala',
  },
  // Metrics buckets tracked (HomeTweetTypePredicates.scala)
  author_score_buckets: ['is_slop_lte_0', 'is_slop_lte_0_2', 'is_slop_gt_0', 'is_slop_gt_0_2', 'is_slop_gt_0_4', 'is_slop_gt_0_6'],
  content_score_buckets: ['is_grokslopscore_low_1', 'is_grokslopscore_med_2', 'is_grokslopscore_high_3'],
};

// Pipeline configuration: candidate sourcing limits
export const PIPELINE_LIMITS = {
  in_network_max_fetch: 600,            // EarlybirdInNetworkCandidatePipeline
  tweet_mixer_max_fetch: 400,           // TweetMixerCandidatePipeline (OON)
  uteg_max_fetch: 300,                  // User-Tweet-Entity-Graph
  backfill_max_fetch: 200,              // BackfillCandidatePipeline
  frs_max_fetch: 100,                   // CommunitiesCandidatePipeline
  server_max_results: 50,               // Final results sent to client
  max_tweet_age_hours: 48,              // CustomSnowflakeIdAgeFilter
  max_consecutive_oon: 2,               // Debunching: max 2 consecutive out-of-network
};

// Text features the algorithm extracts (TweetTextFeaturesExtractor.scala)
export const TEXT_FEATURES_EXTRACTED = [
  'length',                   // Character count (codepoint-based)
  'hasQuestion',              // 20+ Unicode question mark characters checked
  'numCaps',                  // Uppercase character count
  'numWhiteSpaces',           // Whitespace count
  'numNewlines',              // Newline count
  'emojiTokens',              // Set of emoji tokens
  'emoticonTokens',           // Set of emoticon tokens
  'posUnigrams',              // Part-of-speech unigrams
  'posBigrams',               // Part-of-speech bigrams
  'tokens',                   // Text tokens
  'semanticCoreAnnotations',  // Topic/entity annotations
];

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
