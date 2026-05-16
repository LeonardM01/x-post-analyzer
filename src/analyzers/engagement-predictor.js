import { CURRENT_ACTIONS, AUTHOR_DIVERSITY } from '../algorithm-weights.js';

const ACTION_DESCRIPTIONS = {
  favorite: 'Likes',
  reply: 'Replies',
  repost: 'Reposts',
  photo_expand: 'Photo Expands',
  click: 'Good Clicks (expand, URL)',
  profile_click: 'Profile Clicks',
  vqv: 'Video Quality View (VQV)',
  share: 'Shares',
  share_via_dm: 'Share via DM',
  share_via_copy_link: 'Share via Copy Link',
  dwell: 'Dwell',
  quote: 'Quotes',
  quoted_click: 'Quoted Tweet Clicks',
  follow_author: 'Follow Author',
  not_interested: 'Not Interested',
  block_author: 'Block Author',
  mute_author: 'Mute Author',
  report: 'Report',
};

export function predictEngagement(textAnalysis, mediaAnalysis) {
  const baseProbabilities = {
    favorite: 0.04,
    reply: 0.008,
    repost: 0.012,
    photo_expand: 0.01,
    click: 0.02,
    profile_click: 0.015,
    vqv: 0.0,
    share: 0.003,
    share_via_dm: 0.002,
    share_via_copy_link: 0.002,
    dwell: 0.05,
    quote: 0.001,
    quoted_click: 0.002,
    follow_author: 0.005,
    not_interested: 0.002,
    block_author: 0.0005,
    mute_author: 0.0005,
    report: 0.0001,
  };

  const adjustments = calculateAdjustments(textAnalysis, mediaAnalysis);

  let totalScore = 0;
  let totalPositiveScore = 0;
  const predictions = {};
  const breakdown = [];

  for (const [action, entry] of Object.entries(CURRENT_ACTIONS)) {
    const baseProbability = baseProbabilities[action] || 0;
    const adjustment = adjustments[action] || 1.0;
    const adjustedProbability = Math.min(1.0, Math.max(0, baseProbability * adjustment));
    const effectiveWeight = entry.current_weight ?? entry.legacy_2023_weight ?? 0;
    const weightedScore = effectiveWeight * adjustedProbability;

    predictions[action] = {
      probability: adjustedProbability,
      current_weight: entry.current_weight,
      legacy_2023_weight: entry.legacy_2023_weight,
      effective_weight: effectiveWeight,
      weighted_score: weightedScore,
      description: ACTION_DESCRIPTIONS[action],
    };

    totalScore += weightedScore;
    if (effectiveWeight > 0) {
      totalPositiveScore += weightedScore;
    }

    breakdown.push({
      action,
      description: ACTION_DESCRIPTIONS[action],
      probability: (adjustedProbability * 100).toFixed(2) + '%',
      effective_weight: effectiveWeight,
      contribution: weightedScore.toFixed(4),
      is_positive: effectiveWeight > 0,
      weight_source: entry.current_weight !== null ? 'current_2026' : entry.legacy_2023_weight !== null ? 'legacy_2023' : 'unknown',
    });
  }

  breakdown.sort((a, b) => Math.abs(parseFloat(b.contribution)) - Math.abs(parseFloat(a.contribution)));

  const replyContribution = predictions.reply?.weighted_score || 0;
  const likeContribution = predictions.favorite?.weighted_score || 0;
  const replyToLikeRatio = likeContribution > 0 ? replyContribution / likeContribution : 0;

  return {
    total_score: totalScore,
    total_positive_score: totalPositiveScore,
    predictions,
    breakdown,
    reply_to_like_ratio: replyToLikeRatio,
    score_grade: gradeScore(totalScore),
    key_insight: getKeyInsight(predictions, adjustments),
  };
}

function calculateAdjustments(textAnalysis, mediaAnalysis) {
  const adjustments = {};
  for (const action of Object.keys(CURRENT_ACTIONS)) {
    adjustments[action] = 1.0;
  }

  const { metrics, strengths } = textAnalysis;

  const hasQuestion = strengths.some((s) => s.includes('question'));
  if (hasQuestion) {
    adjustments.reply *= 1.8;
    adjustments.follow_author *= 1.3;
  }

  const hasCTA = strengths.some((s) => s.includes('call-to-action'));
  if (hasCTA) {
    adjustments.reply *= 1.4;
  }

  const hasOpinion = strengths.some((s) => s.includes('opinion'));
  if (hasOpinion) {
    adjustments.reply *= 1.5;
    adjustments.repost *= 1.2;
    adjustments.favorite *= 1.1;
  }

  if (metrics.char_count < 71) {
    adjustments.favorite *= 0.6;
    adjustments.repost *= 0.5;
    adjustments.reply *= 0.4;
    adjustments.dwell *= 0.5;
  } else if (metrics.char_count >= 75 && metrics.char_count <= 200) {
    adjustments.favorite *= 1.2;
    adjustments.repost *= 1.1;
    adjustments.reply *= 1.3;
    adjustments.dwell *= 1.3;
  }

  if (metrics.url_count > 0) {
    adjustments.favorite *= 0.7;
    adjustments.repost *= 0.8;
    adjustments.reply *= 0.6;
    adjustments.click *= 1.5;
  }

  if (metrics.hashtag_count > 3) {
    adjustments.not_interested *= 2.0;
    adjustments.report *= 1.5;
    adjustments.favorite *= 0.6;
  }

  if (metrics.mention_count > 3) {
    adjustments.not_interested *= 1.8;
    adjustments.report *= 1.3;
  }

  if (metrics.caps_ratio > 50) {
    adjustments.not_interested *= 1.5;
    adjustments.report *= 1.2;
  }

  if (mediaAnalysis) {
    if (mediaAnalysis.has_image) {
      adjustments.favorite *= 1.8;
      adjustments.repost *= 1.5;
      adjustments.profile_click *= 1.3;
      adjustments.photo_expand = 1.0;
    }
    if (mediaAnalysis.has_video) {
      adjustments.favorite *= 2.0;
      adjustments.repost *= 1.3;
      adjustments.vqv = 1.0;
    }
  }

  return adjustments;
}

function gradeScore(score) {
  if (score >= 1.5) return { grade: 'A', label: 'Excellent', description: 'High viral potential' };
  if (score >= 1.0) return { grade: 'B', label: 'Good', description: 'Above average reach expected' };
  if (score >= 0.5) return { grade: 'C', label: 'Average', description: 'Standard reach expected' };
  if (score >= 0.2) return { grade: 'D', label: 'Below Average', description: 'Lower than average reach' };
  return { grade: 'F', label: 'Poor', description: 'Very low algorithmic distribution' };
}

function getKeyInsight(predictions, adjustments) {
  const replyProb = predictions.reply?.probability || 0;
  const likeProb = predictions.favorite?.probability || 0;

  if (replyProb < likeProb * 0.1) {
    return 'Your tweet is likely to get likes but very few replies. Replies drive reply_score, follow_author_score, and dwell_time — add a question or controversial take.';
  }

  if ((adjustments.not_interested || 1) > 1.5) {
    return 'Spam-like signals detected. These raise not_interested, block_author, and mute_author probabilities — negative heads with heavy legacy weights (-74). Clean up hashtags, mentions, and caps.';
  }

  if (replyProb > likeProb * 0.3) {
    return 'Good reply potential. Replies drive reply_score, dwell_time, and follow_author — multiple confirmed engagement heads. Reply to your commenters to amplify this further.';
  }

  return 'Focus on driving replies — they feed reply_score, dwell_time, and follow_author heads simultaneously. Questions, opinions, and always replying to commenters maximize this.';
}
