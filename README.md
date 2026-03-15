# x-post-analyzer

Analyze your X/Twitter posts against the **real Twitter algorithm** to maximize views, likes, and especially replies.

Built from the [open-source Twitter algorithm](https://github.com/twitter/the-algorithm) and [ML models](https://github.com/twitter/the-algorithm-ml).

## Why This Exists

Twitter open-sourced their recommendation algorithm. The most important finding:

```
Author-engaged Reply:  75.0 weight  (150x a like)
Reply:                 13.5 weight  (27x a like)
Like:                   0.5 weight  (baseline)
Report:              -369.0 weight  (avoid at all costs)
```

**A single reply you engage with is worth more than 150 likes.** This tool analyzes your tweets against these weights and tells you exactly what to fix.

## Quick Start

```bash
# Analyze a tweet
node src/cli.js "Your tweet text here"

# Analyze with image
node src/cli.js --image "Your tweet with an image"

# Compare multiple versions
node src/cli.js --compare "Version 1" "Version 2" "Version 3"

# Save report to file
node src/cli.js -o report.md "Your tweet text"
```

## What It Analyzes

### 1. Text Quality Analysis
- Character length (optimal: 100-250)
- Hashtag count (optimal: 0-2, penalty at 3+)
- @mention count (penalty at 3+)
- External URLs (penalized — put links in replies)
- ALL CAPS ratio (spam signal above 50%)
- Emoji density
- Repeated characters
- Readability and formatting

### 2. Reply Strategy Analysis (Highest Impact)
- Conversation hooks (questions, CTAs)
- Debate triggers (opinions, hot takes)
- Reply potential scoring (0-100)
- Specific patterns: "What do you think?", "Agree or disagree?", "Change my mind", etc.

### 3. Media Impact Analysis
- Video: ~2.5x engagement boost
- Image: ~2.0x engagement boost
- Poll: ~1.8x engagement boost
- No media: ~30% reach penalty

### 4. Engagement Prediction
- Predicts probability of each engagement type
- Calculates weighted score using actual algorithm weights
- Shows contribution breakdown for each engagement type
- Grades prediction (A through F)

### 5. Timing Analysis
- Optimal posting windows
- Peak engagement hours (ET)
- Weekday vs weekend patterns

## Output

The tool generates a detailed markdown report including:

- **Overall Score** (0-100, graded A-F)
- **Issues Found** — what's hurting your reach, sorted by severity
- **Strengths** — what you're doing right
- **Action Steps** — exactly what to change, ordered by algorithm impact
- **Algorithm Weight Reference** — the actual weights from Twitter's code
- **Reply Strategy Deep Dive** — hooks and triggers found
- **Engagement Prediction Breakdown** — probability and contribution per type
- **Quick Checklist** — pass/fail on key criteria

## Using as a Library

```javascript
import { analyzeTweet, generateReport } from './src/index.js';

const analysis = analyzeTweet({
  text: 'Your tweet text here. What do you think?',
  media: { hasImage: true },
  postDate: new Date().toISOString(),
});

// Get the full markdown report
const report = generateReport(analysis);

// Or use the analysis object directly
console.log(analysis.overall_score);        // 0-100
console.log(analysis.overall_grade);        // A-F
console.log(analysis.issues);              // Array of issues
console.log(analysis.suggestions);         // Array of action steps
```

### Compare Multiple Tweets

```javascript
import { compareTweets, generateComparisonReport } from './src/index.js';

const comparison = compareTweets([
  { text: 'Version A of my tweet' },
  { text: 'Version B — what do you think?', media: { hasImage: true } },
]);

console.log(comparison.recommendation);
```

## Algorithm Deep Dive

### Heavy Ranker Weights (from the-algorithm-ml)

The algorithm predicts engagement probabilities and combines them:

`score = Σ (weight_i × P(engagement_i))`

| Engagement | Weight | Impact |
|------------|--------|--------|
| Author-engaged Reply | **75.0** | Reply to your commenters! |
| Reply | **13.5** | Ask questions, drive discussion |
| Profile Click | 12.0 | Be interesting enough to click on |
| Good Click | 11.0 | Make people want to read more |
| Retweet | 1.0 | Shareable content |
| Like | 0.5 | Lowest positive signal |
| Video Watch 50% | 0.005 | Nearly zero direct weight |
| Negative Feedback | **-74.0** | Avoid spam signals |
| Report | **-369.0** | Nuclear penalty |

### Key Scaling Factors

- Out-of-network tweets: **0.75x** (25% penalty)
- Reply tweets: **0.75x** (25% penalty)
- Author diversity decay: **0.5** per subsequent tweet (floor: 0.25)
- Feedback fatigue recovery: **140 days** across 4 steps

### Negative Signals (from InteractionGraphNegativeJob)

1. **Blocks** — critical signal
2. **Mutes** — critical signal
3. **Abuse reports** — critical signal
4. **Spam reports** — critical signal
5. **Unfollows** — moderate signal (90-day window)

## The #1 Rule

**Reply to every single comment on your tweets.**

Author-engaged replies have a weight of 75.0 — that's 150x a like and 5.5x a regular reply. This is by far the single most impactful thing you can do for reach.

## Project Structure

```
x-post-analyzer/
├── src/
│   ├── cli.js                          # CLI entry point
│   ├── index.js                        # Public API exports
│   ├── analyzer.js                     # Main orchestrator
│   ├── algorithm-weights.js            # All algorithm weights & constants
│   ├── analyzers/
│   │   ├── text-analyzer.js            # Text quality analysis
│   │   ├── media-analyzer.js           # Media impact analysis
│   │   ├── timing-analyzer.js          # Posting time analysis
│   │   ├── engagement-predictor.js     # Engagement scoring
│   │   └── reply-strategy-analyzer.js  # Reply optimization
│   └── report/
│       └── markdown-report.js          # Report generator
├── test/
│   └── run.js                          # Test suite
├── examples/
│   ├── analyze-example.js              # Single tweet example
│   └── compare-example.js              # Comparison example
├── CLAUDE.md                           # Analysis skill definition
└── README.md
```

## License

MIT

## Sources

- [twitter/the-algorithm](https://github.com/twitter/the-algorithm) — Core recommendation algorithm
- [twitter/the-algorithm-ml](https://github.com/twitter/the-algorithm-ml) — Heavy ranker ML model
