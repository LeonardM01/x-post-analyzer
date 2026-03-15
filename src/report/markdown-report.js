/**
 * Markdown Report Generator
 * Generates a detailed .md analysis report from tweet analysis results
 */

/**
 * Generate a full markdown report from analysis results
 */
export function generateReport(analysis) {
  const lines = [];

  // Header
  lines.push('# X/Twitter Post Analysis Report');
  lines.push('');
  lines.push(`> Based on the [open-source Twitter algorithm](https://github.com/twitter/the-algorithm)`);
  lines.push(`> Analyzed: ${new Date(analysis.analyzed_at).toLocaleString()}`);
  lines.push('');

  // Overall Score
  lines.push('---');
  lines.push('');
  lines.push('## Overall Score');
  lines.push('');
  lines.push(`### ${analysis.overall_grade} - ${analysis.overall_score}/100`);
  lines.push('');
  lines.push(`**${analysis.summary}**`);
  lines.push('');

  // Tweet Preview
  lines.push('---');
  lines.push('');
  lines.push('## Tweet Analyzed');
  lines.push('');
  lines.push('```');
  lines.push(analysis.tweet_text || '(empty)');
  lines.push('```');
  lines.push('');

  // Score Breakdown
  lines.push('---');
  lines.push('');
  lines.push('## Score Breakdown');
  lines.push('');
  lines.push('| Category | Score | Details |');
  lines.push('|----------|-------|---------|');
  lines.push(`| Text Quality | ${analysis.analysis.text.score}/100 | Length, readability, spam signals |`);
  lines.push(`| Media | ${analysis.analysis.media.has_media ? 'Yes' : 'None'} (${analysis.analysis.media.boost_factor}x) | ${analysis.analysis.media.has_video ? 'Video' : analysis.analysis.media.has_image ? 'Image' : analysis.analysis.media.has_poll ? 'Poll' : 'No media'} |`);
  lines.push(`| Reply Potential | ${analysis.analysis.reply_strategy.reply_score}/100 | Hooks, debate triggers, CTAs |`);
  lines.push(`| Engagement Prediction | Grade ${analysis.analysis.engagement_prediction.score_grade.grade} | ${analysis.analysis.engagement_prediction.score_grade.description} |`);
  lines.push('');

  // Algorithm Weight Context
  lines.push('---');
  lines.push('');
  lines.push('## Algorithm Weight Reference');
  lines.push('');
  lines.push('The Twitter algorithm scores tweets using these engagement weights:');
  lines.push('');
  lines.push('| Engagement Type | Weight | vs. Like |');
  lines.push('|-----------------|--------|----------|');
  lines.push(`| Author-engaged Reply | **${analysis.algorithm_weights.replied_and_engaged_by_author}** | **150x** |`);
  lines.push(`| Reply | **${analysis.algorithm_weights.replied}** | **27x** |`);
  lines.push(`| Profile Click | ${analysis.algorithm_weights.good_profile_click} | 24x |`);
  lines.push(`| Good Click | ${analysis.algorithm_weights.good_click} | 22x |`);
  lines.push(`| Retweet | ${analysis.algorithm_weights.retweeted} | 2x |`);
  lines.push(`| Like | ${analysis.algorithm_weights.favorited} | 1x |`);
  lines.push(`| Video Watch (50%) | ${analysis.algorithm_weights.video_playback_50} | ~0x |`);
  lines.push(`| Negative Feedback | ${analysis.algorithm_weights.negative_feedback} | **-148x** |`);
  lines.push(`| Report | ${analysis.algorithm_weights.report} | **-738x** |`);
  lines.push('');

  // Issues (What's Bad)
  if (analysis.issues.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Issues Found');
    lines.push('');
    for (const issue of analysis.issues) {
      const icon = severityIcon(issue.severity);
      lines.push(`${icon} **[${issue.severity.toUpperCase()}]** [${issue.source}] ${issue.message}`);
      lines.push('');
    }
  }

  // Strengths (What's Good)
  if (analysis.strengths.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Strengths');
    lines.push('');
    for (const strength of analysis.strengths) {
      lines.push(`- [${strength.source}] ${strength.message}`);
    }
    lines.push('');
  }

  // Suggestions (How to Fix)
  if (analysis.suggestions.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Action Steps to Improve');
    lines.push('');
    lines.push('Ordered by impact on algorithmic reach:');
    lines.push('');
    analysis.suggestions.forEach((suggestion, i) => {
      const priorityTag = suggestion.priority === 'high' ? ' **(HIGH IMPACT)**' : suggestion.priority === 'medium' ? '' : ' *(lower priority)*';
      lines.push(`${i + 1}. [${suggestion.source}] ${suggestion.message}${priorityTag}`);
    });
    lines.push('');
  }

  // Reply Strategy Deep Dive
  const rs = analysis.analysis.reply_strategy;
  lines.push('---');
  lines.push('');
  lines.push('## Reply Strategy Analysis');
  lines.push('');
  lines.push(`**Reply Potential Score: ${rs.reply_score}/100**`);
  lines.push('');

  if (rs.hooks_found.length > 0) {
    lines.push('### Conversation Hooks Found');
    lines.push('');
    for (const hook of rs.hooks_found) {
      lines.push(`- ${hook}`);
    }
    lines.push('');
  }

  if (rs.debate_triggers_found.length > 0) {
    lines.push('### Debate Triggers Found');
    lines.push('');
    for (const trigger of rs.debate_triggers_found) {
      lines.push(`- ${trigger}`);
    }
    lines.push('');
  }

  lines.push('### Why Replies Matter Most');
  lines.push('');
  lines.push('```');
  lines.push('Reply weight:               13.5  (27x a like)');
  lines.push('Author-engaged reply weight: 75.0  (150x a like)');
  lines.push('Like weight:                  0.5  (baseline)');
  lines.push('```');
  lines.push('');
  lines.push('> A single reply you engage with is worth more than 150 likes.');
  lines.push('> Always reply to your commenters - this is the #1 growth hack.');
  lines.push('');

  // Engagement Prediction Breakdown
  const ep = analysis.analysis.engagement_prediction;
  lines.push('---');
  lines.push('');
  lines.push('## Engagement Prediction Breakdown');
  lines.push('');
  lines.push(`**Total Predicted Score: ${ep.total_score.toFixed(4)}** (Grade: ${ep.score_grade.grade})`)
  lines.push('');
  lines.push('| Engagement | Probability | Weight | Contribution |');
  lines.push('|------------|-------------|--------|--------------|');
  for (const item of ep.breakdown) {
    const sign = item.is_positive ? '+' : '';
    lines.push(`| ${item.description} | ${item.probability} | ${item.weight} | ${sign}${item.contribution} |`);
  }
  lines.push('');
  lines.push(`**Key Insight:** ${ep.key_insight}`);
  lines.push('');

  // Timing
  const timing = analysis.analysis.timing;
  if (timing.optimal_times.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Optimal Posting Times');
    lines.push('');
    lines.push('| Time Window | Quality |');
    lines.push('|-------------|---------|');
    for (const t of timing.optimal_times) {
      lines.push(`| ${t.time} | ${t.quality} |`);
    }
    lines.push('');
  }

  // Text Metrics
  lines.push('---');
  lines.push('');
  lines.push('## Tweet Metrics');
  lines.push('');
  const m = analysis.analysis.text.metrics;
  lines.push(`- **Characters:** ${m.char_count || 0}/280`);
  lines.push(`- **Hashtags:** ${m.hashtag_count || 0}`);
  lines.push(`- **Mentions:** ${m.mention_count || 0}`);
  lines.push(`- **URLs:** ${m.url_count || 0}`);
  lines.push(`- **Emojis:** ${m.emoji_count || 0}`);
  lines.push(`- **Caps Ratio:** ${m.caps_ratio || 0}%`);
  lines.push(`- **Line Breaks:** ${m.line_breaks || 0}`);
  lines.push('');

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('## Quick Checklist');
  lines.push('');
  lines.push(checkItem(rs.reply_score > 30, 'Has reply triggers (questions, CTAs, opinions)'));
  lines.push(checkItem(!analysis.issues.some((i) => i.severity === 'critical'), 'No critical issues'));
  lines.push(checkItem(analysis.analysis.media.has_media, 'Has media (image/video/poll)'));
  lines.push(checkItem((m.url_count || 0) === 0, 'No external links in main tweet'));
  lines.push(checkItem((m.hashtag_count || 0) <= 2, '2 or fewer hashtags'));
  lines.push(checkItem((m.char_count || 0) >= 100, 'At least 100 characters'));
  lines.push(checkItem(rs.hooks_found.length > 0 || rs.debate_triggers_found.length > 0, 'Contains conversation hooks'));
  lines.push('');
  lines.push('---');
  lines.push('*Generated by [x-post-analyzer](https://github.com/twitter/the-algorithm) - Open source Twitter algorithm analysis tool*');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate a comparison report for multiple tweets
 */
export function generateComparisonReport(comparison) {
  const lines = [];

  lines.push('# X/Twitter Post Comparison Report');
  lines.push('');
  lines.push(`> Comparing ${comparison.ranked_tweets.length} tweets`);
  lines.push('');
  lines.push('## Ranking');
  lines.push('');
  lines.push('| Rank | Tweet # | Score | Grade | Reply Score |');
  lines.push('|------|---------|-------|-------|-------------|');

  for (let i = 0; i < comparison.ranked_tweets.length; i++) {
    const t = comparison.ranked_tweets[i];
    const medal = i === 0 ? ' (Best)' : '';
    lines.push(`| ${i + 1}${medal} | #${t.index} | ${t.overall_score}/100 | ${t.overall_grade} | ${t.analysis.reply_strategy.reply_score}/100 |`);
  }

  lines.push('');
  lines.push(`**Recommendation:** ${comparison.recommendation}`);
  lines.push('');

  // Show full report for the best tweet
  lines.push('---');
  lines.push('');
  lines.push('## Best Tweet - Full Analysis');
  lines.push('');

  const bestReport = generateReport(comparison.best);
  lines.push(bestReport);

  return lines.join('\n');
}

function severityIcon(severity) {
  switch (severity) {
    case 'critical': return '- **!!!**';
    case 'high': return '- **!!**';
    case 'medium': return '- **!**';
    case 'low': return '-';
    default: return '-';
  }
}

function checkItem(condition, label) {
  return condition ? `- [x] ${label}` : `- [ ] ${label}`;
}
