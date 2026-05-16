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
  lines.push(`| AI Slop Score | ${analysis.analysis.slop.slop_score}/100 | ${analysis.analysis.slop.slop_score === 0 ? 'Clean — no AI patterns' : analysis.analysis.slop.slop_score < 25 ? 'Minor AI signals' : analysis.analysis.slop.slop_score < 50 ? 'Moderate AI patterns' : 'High AI slop — rewrite needed'} |`);
  lines.push(`| Engagement Prediction | Grade ${analysis.analysis.engagement_prediction.score_grade.grade} | ${analysis.analysis.engagement_prediction.score_grade.description} |`);
  lines.push('');

  // Algorithm Weight Context
  lines.push('---');
  lines.push('');
  lines.push('## Algorithm Weight Reference');
  lines.push('');
  lines.push('### Current (xai-org 2026)');
  lines.push('');
  lines.push('Numeric weights are not published. Legacy 2023 numbers shown where available (marked *).');
  lines.push('');
  lines.push('| Action | Category | Weight |');
  lines.push('|--------|----------|--------|');
  lines.push('| reply | engagement | unpublished (legacy: 13.5*) |');
  lines.push('| favorite | engagement | unpublished (legacy: 0.5*) |');
  lines.push('| repost | engagement | unpublished (legacy: 1.0*) |');
  lines.push('| click | engagement | unpublished (legacy: 11.0*) |');
  lines.push('| profile_click | engagement | unpublished (legacy: 12.0*) |');
  lines.push('| vqv | media | unpublished (legacy: 0.005*) |');
  lines.push('| photo_expand | engagement | unpublished |');
  lines.push('| share | engagement | unpublished |');
  lines.push('| share_via_dm | engagement | unpublished |');
  lines.push('| dwell | engagement | unpublished |');
  lines.push('| quote | engagement | unpublished |');
  lines.push('| follow_author | engagement | unpublished |');
  lines.push('| not_interested | negative | unpublished (legacy: -74.0*) |');
  lines.push('| block_author | negative | unpublished (legacy: -74.0*) |');
  lines.push('| mute_author | negative | unpublished (legacy: -74.0*) |');
  lines.push('| report | negative | unpublished (legacy: -369.0*) |');
  lines.push('');
  lines.push('### Legacy (2023)');
  lines.push('');
  lines.push('From the-algorithm-ml README, April 2023. Historical reference only.');
  lines.push('');
  lines.push('| Signal | Weight |');
  lines.push('|--------|--------|');
  lines.push(`| replied | ${analysis.algorithm_weights.replied} |`);
  lines.push(`| replied_and_engaged_by_author | ${analysis.algorithm_weights.replied_and_engaged_by_author} |`);
  lines.push(`| good_profile_click | ${analysis.algorithm_weights.good_profile_click} |`);
  lines.push(`| good_click | ${analysis.algorithm_weights.good_click} |`);
  lines.push(`| retweeted | ${analysis.algorithm_weights.retweeted} |`);
  lines.push(`| favorited | ${analysis.algorithm_weights.favorited} |`);
  lines.push(`| video_playback_50 | ${analysis.algorithm_weights.video_playback_50} |`);
  lines.push(`| negative_feedback_v2 | ${analysis.algorithm_weights.negative_feedback_v2} |`);
  lines.push(`| report | ${analysis.algorithm_weights.report} |`);
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
  lines.push('reply_score       — driven by replies to your tweet');
  lines.push('follow_author_score — driven by profile clicks and follows');
  lines.push('dwell_time        — driven by read engagement and thread participation');
  lines.push('```');
  lines.push('');
  lines.push('> Replying to commenters feeds multiple engagement heads simultaneously.');
  lines.push('> Replies also drive dwell_time and follow_author — two confirmed 2026 heads.');
  lines.push('');

  // AI Slop Analysis
  const slop = analysis.analysis.slop;
  lines.push('---');
  lines.push('');
  lines.push('## AI Slop Detection');
  lines.push('');
  lines.push(`**Slop Score: ${slop.slop_score}/100** (0 = human, 100 = pure AI slop)`);
  lines.push('');

  if (slop.is_likely_ai) {
    lines.push(`> **WARNING:** This tweet ${slop.confidence === 'high' ? 'strongly reads' : 'appears to read'} as AI-generated content (confidence: ${slop.confidence}).`);
    lines.push('> The X algorithm tracks `SlopAuthorScore` — repeated AI content can flag your entire account.');
    lines.push('');
  } else if (slop.slop_score === 0) {
    lines.push('> Reads as authentic human writing. No AI patterns detected.');
    lines.push('');
  }

  // Score breakdown
  lines.push('| Component | Score | Weight | Description |');
  lines.push('|-----------|-------|--------|-------------|');
  lines.push(`| Slop Words | ${slop.breakdown.word_score}/100 | 60% | Words overrepresented in AI output |`);
  lines.push(`| Slop Phrases | ${slop.breakdown.phrase_score}/100 | 25% | AI-typical phrase patterns |`);
  lines.push(`| Slop Trigrams | ${slop.breakdown.trigram_score}/100 | 15% | 3-word sequences flagged as AI |`);
  lines.push(`| Structural | ${slop.breakdown.structural_score}/100 | bonus | Formatting, burstiness, tone |`);
  lines.push('');

  if (slop.slop_words_found.length > 0) {
    lines.push('### AI-Flagged Words Found');
    lines.push('');
    lines.push('These words appear at dramatically higher frequency in AI text vs. human text:');
    lines.push('');
    for (const w of slop.slop_words_found) {
      const icon = w.severity === 'critical' ? '!!!' : w.severity === 'high' ? '!!' : '!';
      lines.push(`- **${icon}** \`${w.word}\` (${w.severity})`);
    }
    lines.push('');
  }

  if (slop.slop_phrases_found.length > 0) {
    lines.push('### AI Phrase Patterns Found');
    lines.push('');
    for (const p of slop.slop_phrases_found) {
      lines.push(`- **[${p.severity.toUpperCase()}]** ${p.name}`);
    }
    lines.push('');
  }

  if (slop.slop_trigrams_found.length > 0) {
    lines.push('### AI Trigrams Found');
    lines.push('');
    for (const t of slop.slop_trigrams_found) {
      lines.push(`- \`${t}\``);
    }
    lines.push('');
  }

  if (slop.structural_flags.length > 0) {
    lines.push('### Structural AI Signals');
    lines.push('');
    for (const f of slop.structural_flags) {
      lines.push(`- ${f}`);
    }
    lines.push('');
  }

  lines.push('### Why This Matters');
  lines.push('');
  lines.push('The algorithm has a **two-tier slop detection system**:');
  lines.push('');
  lines.push('```');
  lines.push('TIER 1 — Author-Level (SlopAuthorFeatureHydrator.scala)');
  lines.push('  SlopAuthorFeature       — flags authors with score > 0.3');
  lines.push('  SlopAuthorScoreFeature  — numeric score from abuse detection system');
  lines.push('  SlopFilter              — removes OON tweets from flagged authors');
  lines.push('  SlopMinFollowers = 100  — only filters accounts with 100+ followers');
  lines.push('  → Flags your ENTIRE ACCOUNT, not just one tweet');
  lines.push('');
  lines.push('TIER 2 — Content-Level (GrokSlopScoreRescorer.scala)');
  lines.push('  GrokSlopScore = 1       — Low slop (no penalty)');
  lines.push('  GrokSlopScore = 2       — Medium slop (watched)');
  lines.push('  GrokSlopScore = 3       — High slop (score decay applied)');
  lines.push('  → Multiplies tweet score by decay factor (lower reach)');
  lines.push('');
  lines.push('Users react to AI slop with:');
  lines.push('  "Not interested" click  — weight: -74.0');
  lines.push('  Block / Mute            — tweet removed entirely');
  lines.push('  Report                  — weight: -369.0');
  lines.push('```');
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
  lines.push(checkItem(analysis.analysis.slop.slop_score < 15, 'Not flagged as AI slop'));
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
  lines.push('| Rank | Tweet # | Score | Grade | Reply Score | Slop Score |');
  lines.push('|------|---------|-------|-------|-------------|------------|');

  for (let i = 0; i < comparison.ranked_tweets.length; i++) {
    const t = comparison.ranked_tweets[i];
    const medal = i === 0 ? ' (Best)' : '';
    lines.push(`| ${i + 1}${medal} | #${t.index} | ${t.overall_score}/100 | ${t.overall_grade} | ${t.analysis.reply_strategy.reply_score}/100 | ${t.analysis.slop.slop_score}/100 |`);
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
