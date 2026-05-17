export const CURRENT_ACTIONS = {
  favorite: { category: 'engagement', current_weight: null, legacy_2023_weight: 0.5, legacy_key: 'favorited' },
  reply: { category: 'engagement', current_weight: null, legacy_2023_weight: 13.5, legacy_key: 'replied' },
  repost: { category: 'engagement', current_weight: null, legacy_2023_weight: 1.0, legacy_key: 'retweeted' },
  photo_expand: { category: 'engagement', current_weight: null, legacy_2023_weight: null },
  click: { category: 'engagement', current_weight: null, legacy_2023_weight: 11.0, legacy_key: 'good_click' },
  profile_click: { category: 'engagement', current_weight: null, legacy_2023_weight: 12.0, legacy_key: 'good_profile_click' },
  vqv: { category: 'media', current_weight: null, legacy_2023_weight: 0.005, legacy_key: 'video_playback_50', notes: 'duration-gated by MIN_VIDEO_DURATION_MS (value unknown)' },
  share: { category: 'engagement', current_weight: null, legacy_2023_weight: null },
  share_via_dm: { category: 'engagement', current_weight: null, legacy_2023_weight: null },
  share_via_copy_link: { category: 'engagement', current_weight: null, legacy_2023_weight: null },
  dwell: { category: 'engagement', current_weight: null, legacy_2023_weight: null },
  quote: { category: 'engagement', current_weight: null, legacy_2023_weight: null },
  quoted_click: { category: 'engagement', current_weight: null, legacy_2023_weight: null },
  follow_author: { category: 'engagement', current_weight: null, legacy_2023_weight: null },
  not_interested: { category: 'negative', current_weight: null, legacy_2023_weight: -74.0, legacy_key: 'negative_feedback_v2_part' },
  block_author: { category: 'negative', current_weight: null, legacy_2023_weight: -74.0, legacy_key: 'negative_feedback_v2_part' },
  mute_author: { category: 'negative', current_weight: null, legacy_2023_weight: -74.0, legacy_key: 'negative_feedback_v2_part' },
  report: { category: 'negative', current_weight: null, legacy_2023_weight: -369.0 },
};

export const CONTINUOUS_ACTIONS = ['dwell_time', 'video_watch_time', 'scroll_depth'];

export const LEGACY_2023_WEIGHTS = {
  favorited: 0.5,
  retweeted: 1.0,
  replied: 13.5,
  replied_and_engaged_by_author: 75.0,
  good_profile_click: 12.0,
  good_click: 11.0,
  video_playback_50: 0.005,
  negative_feedback_v2: -74.0,
  report: -369.0,
};

export const GROX_SAFETY_CATEGORIES = [
  { id: 'violent_media', label: 'Violent Media', deluxe_reasoning: true },
  { id: 'adult_content', label: 'Adult Content', deluxe_reasoning: true },
  { id: 'spam', label: 'Spam', deluxe_reasoning: false },
  { id: 'illegal_regulated', label: 'Illegal and Regulated Behaviors', deluxe_reasoning: false },
  { id: 'hate_abuse', label: 'Hate or Abuse', deluxe_reasoning: false },
  { id: 'violent_speech', label: 'Violent Speech', deluxe_reasoning: false },
  { id: 'self_harm', label: 'Suicide or Self Harm', deluxe_reasoning: false },
];

export const AUTHOR_DIVERSITY = {
  decay_factor: 0.5,
  floor: 0.25,
  small_follow_graph_threshold: 50,
  in_network: { decay: 0.5, floor: 0.25 },
  out_of_network: { decay: 0.5, floor: 0.25 },
};

export const OON_WEIGHT_FACTOR = 0.75;

export const FEEDBACK_FATIGUE = {
  lower_bound: 0.2,
  upper_bound: 1.0,
  time_period_days: 140,
  increment_count: 4,
};

export const NEGATIVE_SIGNALS = {
  blocks: { severity: 'critical', description: 'User blocked the author — tweet completely removed' },
  mutes: { severity: 'critical', description: 'User muted the author — tweet completely removed' },
  blocked_by: { severity: 'critical', description: 'Author blocks viewer — tweet completely removed' },
  abuse_reports: { severity: 'critical', description: 'Reported as abuse' },
  spam_reports: { severity: 'critical', description: 'Reported as spam' },
  unfollows: { severity: 'moderate', description: 'User unfollowed (90-day window)', window_days: 90 },
};

export const TEXT_FEATURES_EXTRACTED = [
  'length',
  'hasQuestion',
  'numCaps',
  'numWhiteSpaces',
  'numNewlines',
  'emojiTokens',
  'emoticonTokens',
  'posUnigrams',
  'posBigrams',
  'tokens',
  'semanticCoreAnnotations',
];

export const OPTIMAL_TWEET = {
  text_length: {
    min: 75,
    ideal_min: 75,
    ideal_max: 200,
    max: 280,
  },
  hashtags: {
    ideal: { min: 0, max: 2 },
    penalty_threshold: 3,
  },
  mentions: {
    ideal: { min: 0, max: 1 },
    penalty_threshold: 3,
  },
  urls: {
    ideal: 0,
    max_before_penalty: 1,
  },
  media: {
    image_boost: 2.0,
    video_boost: 2.5,
    no_media_penalty: 0.7,
  },
};

export const REPLY_TRIGGERS = {
  question_mark: { boost: 1.3, description: 'Questions drive replies' },
  opinion_statement: { boost: 1.2, description: 'Strong opinions generate debate' },
  call_to_action: { boost: 1.15, description: 'Direct CTAs increase interaction' },
  thread_hook: { boost: 1.1, description: 'Thread starters get more engagement' },
};

export const SPAM_SIGNALS = {
  all_caps_ratio: 0.5,
  excessive_emojis: 5,
  excessive_hashtags: 3,
  excessive_mentions: 3,
  url_only: true,
  duplicate_chars: 3,
};
