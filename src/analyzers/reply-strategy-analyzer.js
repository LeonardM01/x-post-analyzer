/**
 * Reply Strategy Analyzer - Evaluates how well a tweet is optimized for driving replies
 *
 * This is the MOST IMPORTANT analyzer because:
 * - Replies have a weight of 13.5 (27x a like at 0.5)
 * - Author-engaged replies have a weight of 75.0 (150x a like)
 * - The algorithm MASSIVELY rewards conversation generation
 */

import { LEGACY_2023_WEIGHTS } from '../algorithm-weights.js';

/**
 * Conversational hooks that drive replies
 */
const CONVERSATION_HOOKS = [
  { pattern: /\?$/, name: 'Ends with question', weight: 3 },
  { pattern: /\?[^\w]*$/, name: 'Question at end', weight: 3 },
  { pattern: /what do you think/i, name: '"What do you think"', weight: 4 },
  { pattern: /do you agree/i, name: '"Do you agree"', weight: 4 },
  { pattern: /what['']s your (take|opinion|experience|favorite|thought)/i, name: 'Asks for personal take', weight: 4 },
  { pattern: /agree or disagree/i, name: '"Agree or disagree"', weight: 5 },
  { pattern: /change my mind/i, name: '"Change my mind"', weight: 5 },
  { pattern: /am i (wrong|right|the only)/i, name: 'Validation seeking', weight: 4 },
  { pattern: /hot take/i, name: 'Hot take', weight: 3 },
  { pattern: /unpopular opinion/i, name: 'Unpopular opinion', weight: 4 },
  { pattern: /controversial/i, name: 'Controversial framing', weight: 3 },
  { pattern: /rank (these|them|your)/i, name: 'Ranking request', weight: 4 },
  { pattern: /which (one|do you|would)/i, name: 'Choice question', weight: 4 },
  { pattern: /tell me (about|why|how|your)/i, name: 'Tell me...', weight: 3 },
  { pattern: /reply (with|if|your)/i, name: 'Direct reply request', weight: 4 },
  { pattern: /drop (a|your)/i, name: '"Drop your..."', weight: 3 },
  { pattern: /wrong answers only/i, name: '"Wrong answers only"', weight: 5 },
  { pattern: /fill in the blank/i, name: 'Fill in the blank', weight: 4 },
  { pattern: /\bor\b.*\?/i, name: '"A or B?" format', weight: 3 },
  { pattern: /if you could/i, name: 'Hypothetical question', weight: 3 },
];

/**
 * Debate triggers - statements that provoke disagreement/discussion
 */
const DEBATE_TRIGGERS = [
  { pattern: /\bis (dead|overrated|underrated|overhyped)\b/i, name: 'Provocative claim', weight: 3 },
  { pattern: /\bnobody (talks|cares|knows) about\b/i, name: 'Exclusivity claim', weight: 3 },
  { pattern: /stop (doing|saying|using|posting)/i, name: 'Directive statement', weight: 3 },
  { pattern: /the (real|actual|truth|problem) (is|about)/i, name: 'Authority statement', weight: 2 },
  { pattern: /most people (don['']t|are|get|think)/i, name: '"Most people" framing', weight: 3 },
  { pattern: /i['']m sorry but/i, name: 'Apologetic disagreement', weight: 2 },
  { pattern: /\bunpopular\b/i, name: 'Unpopular framing', weight: 3 },
  { pattern: /here['']s the thing/i, name: '"Here\'s the thing"', weight: 2 },
  { pattern: /\bnot enough people\b/i, name: '"Not enough people" framing', weight: 2 },
];

/**
 * Analyze reply optimization
 */
export function analyzeReplyStrategy(text) {
  const findings = {
    score: 0,
    reply_score: 0,      // 0-100 score specifically for reply potential
    hooks_found: [],
    debate_triggers_found: [],
    issues: [],
    strengths: [],
    suggestions: [],
    algorithm_context: {
      reply_weight: LEGACY_2023_WEIGHTS.replied,
      author_reply_weight: LEGACY_2023_WEIGHTS.replied_and_engaged_by_author,
      like_weight: LEGACY_2023_WEIGHTS.favorited,
      reply_vs_like_ratio: LEGACY_2023_WEIGHTS.replied / LEGACY_2023_WEIGHTS.favorited,
    },
  };

  if (!text || text.trim().length === 0) return findings;

  // Check for conversation hooks
  let hookScore = 0;
  for (const hook of CONVERSATION_HOOKS) {
    if (hook.pattern.test(text)) {
      findings.hooks_found.push(hook.name);
      hookScore += hook.weight;
    }
  }

  // Check for debate triggers
  let debateScore = 0;
  for (const trigger of DEBATE_TRIGGERS) {
    if (trigger.pattern.test(text)) {
      findings.debate_triggers_found.push(trigger.name);
      debateScore += trigger.weight;
    }
  }

  // Calculate reply potential score (0-100)
  findings.reply_score = Math.min(100, (hookScore + debateScore) * 8);

  if (findings.hooks_found.length === 0 && findings.debate_triggers_found.length === 0) {
    findings.issues.push({
      severity: 'high',
      message: 'No reply triggers detected. This tweet is unlikely to generate meaningful replies.',
    });
    findings.suggestions.push(
      'Add a question at the end of your tweet. Replies are worth 27x more than likes in the algorithm.'
    );
    findings.suggestions.push(
      'Frame your content as an opinion or hot take to provoke discussion.'
    );
    findings.suggestions.push(
      'Use formats like "Agree or disagree:", "Hot take:", or "Rank these:" to invite responses.'
    );
    findings.score = -10;
  } else {
    if (findings.hooks_found.length > 0) {
      findings.strengths.push(
        `Found ${findings.hooks_found.length} conversation hook(s): ${findings.hooks_found.join(', ')}`
      );
      findings.score += findings.hooks_found.length * 5;
    }
    if (findings.debate_triggers_found.length > 0) {
      findings.strengths.push(
        `Found ${findings.debate_triggers_found.length} debate trigger(s): ${findings.debate_triggers_found.join(', ')}`
      );
      findings.score += findings.debate_triggers_found.length * 4;
    }
  }

  // Author engagement reminder (most important factor)
  findings.suggestions.push(
    'Reply to commenters — it drives reply_score, follow_author_score, and dwell_time, all confirmed engagement heads in the 2026 model.'
  );

  // Check for "conversation continuation" potential
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 1 && !text.includes('?')) {
    findings.suggestions.push(
      'Single-statement tweets without questions rarely generate replies. Add "What do you think?" or similar.'
    );
  }

  return findings;
}
