/**
 * Engagement Predictor - Predicts how the Twitter algorithm will score a tweet
 * Based on the Heavy Ranker weights from the-algorithm-ml
 */

import { ENGAGEMENT_WEIGHTS, SCALE_FACTORS, AUTHOR_DIVERSITY } from '../algorithm-weights.js';

/**
 * Engagement type descriptions for the report
 */
const ENGAGEMENT_DESCRIPTIONS = {
  favorited: 'Likes',
  retweeted: 'Retweets',
  replied: 'Replies',
  replied_and_engaged_by_author: 'Author-engaged Replies',
  good_profile_click: 'Profile Clicks',
  good_click: 'Good Clicks (expand, URL)',
  video_playback_50: 'Video Watch (50%+)',
  report: 'Reports',
  negative_feedback: 'Negative Feedback ("See less")',
};

/**
 * Estimate engagement probabilities based on tweet characteristics
 */
export function predictEngagement(textAnalysis, mediaAnalysis) {
  const predictions = {};
  const breakdown = [];

  // Base probabilities (average tweet performance)
  const baseProbabilities = {
    favorited: 0.04,
    retweeted: 0.012,
    replied: 0.008,
    replied_and_engaged_by_author: 0.003,
    good_profile_click: 0.015,
    good_click: 0.02,
    video_playback_50: 0.0,
    report: 0.0001,
    negative_feedback: 0.002,
  };

  // Adjust probabilities based on tweet analysis
  const adjustments = calculateAdjustments(textAnalysis, mediaAnalysis);

  let totalScore = 0;
  let totalPositiveScore = 0;

  for (const [engagement, weight] of Object.entries(ENGAGEMENT_WEIGHTS)) {
    const baseProbability = baseProbabilities[engagement] || 0;
    const adjustment = adjustments[engagement] || 1.0;
    const adjustedProbability = Math.min(1.0, Math.max(0, baseProbability * adjustment));
    const weightedScore = weight * adjustedProbability;

    predictions[engagement] = {
      probability: adjustedProbability,
      weight,
      weighted_score: weightedScore,
      description: ENGAGEMENT_DESCRIPTIONS[engagement],
    };

    totalScore += weightedScore;
    if (weight > 0) {
      totalPositiveScore += weightedScore;
    }

    breakdown.push({
      engagement,
      description: ENGAGEMENT_DESCRIPTIONS[engagement],
      probability: (adjustedProbability * 100).toFixed(2) + '%',
      weight,
      contribution: weightedScore.toFixed(4),
      is_positive: weight > 0,
    });
  }

  // Sort breakdown by absolute contribution
  breakdown.sort((a, b) => Math.abs(parseFloat(b.contribution)) - Math.abs(parseFloat(a.contribution)));

  // Calculate reply-to-like ratio (key metric)
  const replyContribution =
    (predictions.replied?.weighted_score || 0) +
    (predictions.replied_and_engaged_by_author?.weighted_score || 0);
  const likeContribution = predictions.favorited?.weighted_score || 0;
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

/**
 * Calculate probability adjustments based on tweet content
 */
function calculateAdjustments(textAnalysis, mediaAnalysis) {
  const adjustments = {
    favorited: 1.0,
    retweeted: 1.0,
    replied: 1.0,
    replied_and_engaged_by_author: 1.0,
    good_profile_click: 1.0,
    good_click: 1.0,
    video_playback_50: 1.0,
    report: 1.0,
    negative_feedback: 1.0,
  };

  const { metrics, strengths, issues } = textAnalysis;

  // Question mark boosts reply probability significantly
  const hasQuestion = strengths.some((s) => s.includes('question'));
  if (hasQuestion) {
    adjustments.replied *= 1.8;
    adjustments.replied_and_engaged_by_author *= 1.5;
  }

  // CTA boosts replies
  const hasCTA = strengths.some((s) => s.includes('call-to-action'));
  if (hasCTA) {
    adjustments.replied *= 1.4;
  }

  // Opinion/take boosts replies and engagement
  const hasOpinion = strengths.some((s) => s.includes('opinion'));
  if (hasOpinion) {
    adjustments.replied *= 1.5;
    adjustments.retweeted *= 1.2;
    adjustments.favorited *= 1.1;
  }

  // Short tweets get less engagement
  if (metrics.char_count < 71) {
    adjustments.favorited *= 0.6;
    adjustments.retweeted *= 0.5;
    adjustments.replied *= 0.4;
  } else if (metrics.char_count >= 100 && metrics.char_count <= 250) {
    adjustments.favorited *= 1.2;
    adjustments.retweeted *= 1.1;
    adjustments.replied *= 1.3;
  }

  // URLs reduce reach
  if (metrics.url_count > 0) {
    adjustments.favorited *= 0.7;
    adjustments.retweeted *= 0.8;
    adjustments.replied *= 0.6;
    adjustments.good_click *= 1.5; // But increase click probability
  }

  // Spam signals increase negative feedback
  if (metrics.hashtag_count > 3) {
    adjustments.negative_feedback *= 2.0;
    adjustments.report *= 1.5;
    adjustments.favorited *= 0.6;
  }

  if (metrics.mention_count > 3) {
    adjustments.negative_feedback *= 1.8;
    adjustments.report *= 1.3;
  }

  if (metrics.caps_ratio > 50) {
    adjustments.negative_feedback *= 1.5;
    adjustments.report *= 1.2;
  }

  // Media boosts
  if (mediaAnalysis) {
    if (mediaAnalysis.has_image) {
      adjustments.favorited *= 1.8;
      adjustments.retweeted *= 1.5;
      adjustments.good_profile_click *= 1.3;
    }
    if (mediaAnalysis.has_video) {
      adjustments.favorited *= 2.0;
      adjustments.retweeted *= 1.3;
      adjustments.video_playback_50 = 1.0;
    }
  }

  return adjustments;
}

/**
 * Grade the predicted score
 */
function gradeScore(score) {
  if (score >= 1.5) return { grade: 'A', label: 'Excellent', description: 'High viral potential' };
  if (score >= 1.0) return { grade: 'B', label: 'Good', description: 'Above average reach expected' };
  if (score >= 0.5) return { grade: 'C', label: 'Average', description: 'Standard reach expected' };
  if (score >= 0.2) return { grade: 'D', label: 'Below Average', description: 'Lower than average reach' };
  return { grade: 'F', label: 'Poor', description: 'Very low algorithmic distribution' };
}

/**
 * Generate the most important insight
 */
function getKeyInsight(predictions, adjustments) {
  const replyProb = predictions.replied?.probability || 0;
  const likeProb = predictions.favorited?.probability || 0;

  if (replyProb < likeProb * 0.1) {
    return 'Your tweet is likely to get likes but very few replies. Since replies are worth 27x more than likes in the algorithm, add a question or controversial take to drive discussion.';
  }

  if (adjustments.negative_feedback > 1.5) {
    return 'Your tweet has spam-like characteristics that may trigger negative feedback signals. Clean up hashtags, mentions, and caps to avoid the -74 penalty weight.';
  }

  if (replyProb > likeProb * 0.3) {
    return 'Good reply potential! The algorithm heavily rewards replies (13.5 weight) and especially author-engaged replies (75.0 weight). Make sure to reply back to commenters.';
  }

  return 'Focus on driving replies - they are worth 27x likes in the algorithm. Ask questions, share opinions, and always reply to your commenters.';
}
