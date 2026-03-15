<p align="center">
  <h1 align="center">X Post Analyzer</h1>
  <p align="center">
    Analyze your tweets against the <strong>real Twitter algorithm</strong> before you post.<br/>
    Get a score, find issues, and follow step-by-step fixes to maximize reach.
  </p>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &nbsp;&bull;&nbsp;
  <a href="#how-it-works">How It Works</a> &nbsp;&bull;&nbsp;
  <a href="#cli-reference">CLI Reference</a> &nbsp;&bull;&nbsp;
  <a href="#api-usage">API Usage</a> &nbsp;&bull;&nbsp;
  <a href="#the-algorithm">The Algorithm</a>
</p>

---

## The Problem

You write a tweet. You hit post. It gets 12 likes. Meanwhile some guy posting "hot take: water is wet" gets 50K impressions. Why?

**Because the algorithm decides who sees your tweet** — and it has very specific preferences baked into its scoring model.

Twitter [open-sourced their algorithm](https://github.com/twitter/the-algorithm). We read all of it. This tool turns those findings into actionable feedback you can use *before* you post.

---

## The Most Important Thing You'll Learn

The algorithm scores every tweet using a weighted formula. Here's what each engagement is worth:

```
  Engagement Type              Weight    vs. a Like
  ─────────────────────────    ──────    ──────────
  You reply to a commenter      75.0       150x
  Someone replies                13.5        27x
  Profile click                  12.0        24x
  Detail expand / link click     11.0        22x
  Retweet                         1.0         2x
  Like                            0.5         1x   ← baseline
  ─────────────────────────    ──────    ──────────
  "Show less often" click       -74.0      -148x
  Report                       -369.0      -738x
```

**One reply you engage with = 150 likes.** That's not a metaphor. That's the actual math from `the-algorithm-ml`.

---

## Quick Start

Zero dependencies. Just Node.js (18+).

```bash
# Clone it
git clone https://github.com/your-username/x-post-analyzer.git
cd x-post-analyzer

# Analyze a tweet
node src/cli.js "Your tweet text here"

# That's it. You'll get a score and a full report saved to analysis-report.md
```

### Example

```bash
$ node src/cli.js --image "I've mass mass been building for 10 years and here's
what nobody tells you: the best engineers delete more code than they write.
Every line removed is a line that can't break. What's the best code you've
ever deleted?"

  Score: 78/100 (B)
  Good - Solid tweet with room for improvement. Should get decent engagement.
  Reply Potential: 48/100

  Issues (1):
    [MEDIUM] No external links in main tweet - good, but no media reduces reach by ~30%.

  Top Suggestions:
    1. CRITICAL: Reply to EVERY comment. Author-engaged replies = 75.0 weight (150x a like).
    2. Add line breaks for readability.
    3. Use high-contrast, eye-catching images that stop the scroll.

  Full report saved to: analysis-report.md
```

---

## How It Works

The tool runs **5 analyzers** on your tweet, each targeting a different part of the algorithm:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                        Your Tweet Text                         │
 └──────────────────────────┬──────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │    Text      │ │   Reply      │ │   Media      │
   │  Analyzer    │ │  Strategy    │ │  Analyzer    │
   │              │ │  Analyzer    │ │              │
   │ • Length     │ │              │ │ • Image 2x   │
   │ • Hashtags   │ │ • 20+ hooks  │ │ • Video 2.5x │
   │ • URLs       │ │ • 9+ debate  │ │ • Poll 1.8x  │
   │ • Caps/spam  │ │   triggers   │ │ • None 0.7x  │
   │ • Emojis     │ │ • CTAs       │ │              │
   └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
          │                │                 │
          ▼                ▼                 ▼
   ┌──────────────┐ ┌──────────────┐        │
   │  Engagement  │ │   Timing     │        │
   │  Predictor   │ │  Analyzer    │        │
   │              │ │              │        │
   │ • Score per  │ │ • Peak hours │        │
   │   engagement │ │ • Weekday vs │        │
   │   type       │ │   weekend    │        │
   │ • Algorithm  │ │              │        │
   │   formula    │ │              │        │
   └──────┬───────┘ └──────┬───────┘        │
          │                │                 │
          └────────────────┼─────────────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │  Combined Score   │
                 │  0-100 (A-F)     │
                 │                   │
                 │  + Issues list    │
                 │  + Strengths      │
                 │  + Action steps   │
                 │  + Full .md report│
                 └───────────────────┘
```

### 1. Text Quality Analyzer

Checks the signals the algorithm actually extracts (from `TweetTextFeaturesExtractor.scala`):

| Signal | Optimal | Why |
|--------|---------|-----|
| Character length | 100–250 | Short tweets get ignored, long ones get read |
| Hashtags | 0–2 | 3+ triggers spam detection |
| @mentions | 0–1 | 3+ triggers spam detection |
| External URLs | 0 | Algorithm keeps users on-platform — put links in replies |
| ALL CAPS ratio | < 50% | High caps = spam signal |
| Emojis | ≤ 5 | Excessive = spam signal |
| Repeated chars | None | "!!!!!" and "sooooo" flag as low quality |
| Line breaks | Use them | Readability increases dwell time |

### 2. Reply Strategy Analyzer (Highest Impact)

This is the most important analyzer because **replies are worth 27x a like** and **author-engaged replies are worth 150x a like**.

It detects 20+ conversation hooks:
- Questions (`What do you think?`, `Which one?`, `How do you...`)
- Debate triggers (`Unpopular opinion`, `Change my mind`, `Agree or disagree?`)
- Engagement CTAs (`Reply with`, `Drop your`, `Wrong answers only`)
- Choice prompts (`A or B?`, `Rank these`, `Fill in the blank`)

And 9+ debate triggers that provoke discussion:
- Provocative claims (`X is overrated`, `X is dead`)
- Authority framing (`Most people don't...`, `Here's the thing...`)
- Directive statements (`Stop doing X`, `Nobody talks about X`)

### 3. Media Impact Analyzer

The algorithm treats media types differently:

| Media | Boost | Notes |
|-------|-------|-------|
| Video | ~2.5x | Algorithm tracks 50% watch-through. Keep under 60s. |
| Image | ~2.0x | High-contrast, scroll-stopping images work best |
| Poll | ~1.8x | Voting = interaction = algorithmic signal |
| GIF | ~1.5x | Visual appeal without video commitment |
| None | 0.7x | Text-only gets ~30% less distribution |

### 4. Engagement Predictor

Uses the actual Heavy Ranker formula from `the-algorithm-ml`:

```
score = Σ (weight_i × P(engagement_i))
```

Predicts probability for each of the 15 engagement types the model scores, then calculates weighted contribution to show you exactly where your tweet's score comes from.

### 5. Timing Analyzer

The algorithm weights recency heavily. The first 30–60 minutes of engagement determine reach.

| Time Window (ET) | Day | Quality |
|------------------|-----|---------|
| 8:00 AM – 11:00 AM | Weekdays | Best |
| 12:00 PM – 3:00 PM | Weekdays | Great |
| 5:00 PM – 8:00 PM | Weekdays | Good |
| 10:00 AM – 2:00 PM | Weekends | Good |

---

## CLI Reference

```
x-post-analyzer [options] "Your tweet text"
```

### Options

| Flag | Description |
|------|-------------|
| `-h`, `--help` | Show help and algorithm weights |
| `-o`, `--output FILE` | Save report to specific file (default: `analysis-report.md`) |
| `-f`, `--file FILE` | Read tweet(s) from a file (one per line) |
| `--image` | Tweet includes an image |
| `--video` | Tweet includes a video |
| `--gif` | Tweet includes a GIF |
| `--poll` | Tweet includes a poll |
| `--compare` | Compare multiple tweets and rank them |
| `--date DATE` | ISO date for posting time analysis |

### Examples

```bash
# Basic analysis
node src/cli.js "Just shipped a new feature! What do you think?"

# With media flags
node src/cli.js --image "Check out this design. What would you change?"
node src/cli.js --video "Watch how this works. Would you use it?"
node src/cli.js --poll "Which framework do you prefer?"

# Save to custom file
node src/cli.js -o my-report.md "Your tweet here"

# Compare tweet versions (A/B test before posting)
node src/cli.js --compare \
  "Just launched our product!" \
  "Just launched our product! What's the #1 feature you'd want?" \
  "Hot take: most products launch too late. We just shipped ours. Agree or disagree?"

# Analyze from file
echo "Tweet one here" > tweets.txt
echo "Tweet two here" >> tweets.txt
node src/cli.js -f tweets.txt --compare -o comparison.md
```

---

## The Report

Every analysis generates a detailed markdown file with these sections:

| Section | What's in it |
|---------|-------------|
| **Overall Score** | 0–100 grade (A through F) with summary |
| **Tweet Analyzed** | Your tweet text for reference |
| **Score Breakdown** | Per-category scores (text, media, reply, engagement) |
| **Algorithm Weight Reference** | The actual weights from Twitter's code |
| **Issues Found** | What's hurting your reach, sorted by severity |
| **Strengths** | What you're doing right |
| **Action Steps to Improve** | Exactly what to change, ordered by impact |
| **Reply Strategy Analysis** | Hooks and triggers found, reply potential score |
| **Engagement Prediction** | Probability and weighted contribution per type |
| **Optimal Posting Times** | Best windows to post |
| **Tweet Metrics** | Character count, hashtags, mentions, URLs, emojis, caps ratio |
| **Quick Checklist** | Pass/fail on the 7 most important criteria |

---

## API Usage

Use it as a library in your own tools:

### Analyze a Single Tweet

```javascript
import { analyzeTweet, generateReport } from './src/index.js';

const analysis = analyzeTweet({
  text: 'Your tweet text here. What do you think?',
  media: { hasImage: true },    // optional
  postDate: '2025-04-01T14:00:00Z',  // optional
});

console.log(analysis.overall_score);   // 0-100
console.log(analysis.overall_grade);   // "A" through "F"
console.log(analysis.issues);          // [{ severity, message, source }]
console.log(analysis.strengths);       // [{ message, source }]
console.log(analysis.suggestions);     // [{ message, source, priority }]

// Generate the full markdown report
const report = generateReport(analysis);
```

### Compare Multiple Versions

```javascript
import { compareTweets, generateComparisonReport } from './src/index.js';

const comparison = compareTweets([
  { text: 'Version A — just a statement.' },
  { text: 'Version B — what do you think?', media: { hasImage: true } },
  { text: 'Version C — unpopular opinion: X is overrated. Change my mind.' },
]);

console.log(comparison.recommendation);
// → "Tweet #3 is predicted to perform best with a score of 82/100."

console.log(comparison.ranked_tweets);
// → Sorted by score, best first

const report = generateComparisonReport(comparison);
```

### Use Individual Analyzers

```javascript
import { analyzeText } from './src/index.js';
import { analyzeReplyStrategy } from './src/index.js';
import { analyzeMedia } from './src/index.js';
import { predictEngagement } from './src/index.js';

// Just check text quality
const text = analyzeText('Your tweet here');
console.log(text.score, text.issues, text.strengths);

// Just check reply potential
const reply = analyzeReplyStrategy('Hot take: X is overrated. Agree?');
console.log(reply.reply_score, reply.hooks_found);

// Just check media impact
const media = analyzeMedia({ hasVideo: true });
console.log(media.boost_factor); // 2.5
```

---

## The Algorithm

Everything in this tool comes from two repos Twitter open-sourced:

- **[twitter/the-algorithm](https://github.com/twitter/the-algorithm)** — The recommendation pipeline (Scala/Java)
- **[twitter/the-algorithm-ml](https://github.com/twitter/the-algorithm-ml)** — The Heavy Ranker ML model (Python)

### How the "For You" Feed Works

```
  ~500M candidate tweets
        │
        ▼
  ┌─────────────────────────────────┐
  │  Stage 1: Candidate Sourcing    │  9 pipelines run in parallel
  │  ─────────────────────────────  │
  │  In-network (Earlybird)   600   │  Tweets from people you follow
  │  Tweet Mixer (OON)        400   │  Out-of-network recommendations
  │  User-Tweet-Entity Graph  300   │  Graph-based recommendations
  │  Backfill                 200   │  Older quality content
  │  Communities              100   │  Community tweets
  │  + Lists, Content Explore, etc. │
  └──────────────┬──────────────────┘
                 │ ~1,500 candidates
                 ▼
  ┌─────────────────────────────────┐
  │  Stage 2: Filtering             │
  │  ─────────────────────────────  │
  │  • Max age: 48 hours            │
  │  • Block/mute check             │
  │  • Previously seen/served       │
  │  • Feedback fatigue             │
  │  • NSFW / safety filters        │
  └──────────────┬──────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────┐
  │  Stage 3: Heavy Ranker (ML)     │  MaskNet multi-task model
  │  ─────────────────────────────  │
  │  Predicts 15 engagement types:  │
  │  • Like, RT, reply, bookmark    │
  │  • Profile click, good click    │
  │  • Video quality view/watch     │
  │  • Share, dwell time            │
  │  • Negative feedback, report    │
  │                                 │
  │  score = Σ (weight × P(type))   │
  └──────────────┬──────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────┐
  │  Stage 4: Heuristic Rescoring   │  Multiplicative factors
  │  ─────────────────────────────  │
  │  • Out-of-network: ×0.75       │
  │  • Reply tweets: ×0.75         │
  │  • Author diversity decay       │
  │  • Impressed author decay       │
  │  • Feedback fatigue: ×0.2–1.0  │
  │  • Content quality (Grok)       │
  │  • AI controls (Show More/Less) │
  └──────────────┬──────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────┐
  │  Stage 5: Final Selection       │
  │  ─────────────────────────────  │
  │  • Sort by score descending     │
  │  • Max 2 consecutive OON tweets │
  │  • Take top 50                  │
  │  • Insert ads, Who to Follow    │
  └──────────────┬──────────────────┘
                 │
                 ▼
            Your Feed
```

### Key Source Files

| File | What it does |
|------|-------------|
| `PredictedScoreFeature.scala` | Defines all 15 engagement prediction heads |
| `HomeGlobalParams.scala` | All model weight parameters |
| `RerankerUtil.scala` | Score aggregation formula |
| `HeuristicScorer.scala` | Heuristic rescoring pipeline |
| `RescoringFactorProvider.scala` | All rescoring factor implementations |
| `FeedbackFatigueScorer.scala` | Feedback fatigue scoring (0.2–1.0 over 140 days) |
| `OONTweetScalingScorer.scala` | Out-of-network 0.75x scaling |
| `TweetTextFeaturesExtractor.scala` | Text feature extraction |
| `TweetMediaFeaturesExtractor.scala` | Media feature extraction |
| `SGSAuthorFilter.scala` | Block/mute hard filtering |
| `InteractionGraphNegativeJob.scala` | Negative interaction signals |

### Negative Signals That Kill Reach

| Signal | Effect | Source |
|--------|--------|--------|
| Block | Tweet completely removed from feed | `SGSAuthorFilter` |
| Mute | Tweet completely removed from feed | `SGSAuthorFilter` |
| "See less often" | Score multiplied by 0.2 (fades over 140 days) | `FeedbackFatigueScorer` |
| Report | -369.0 weight in scoring formula | Heavy Ranker |
| Negative feedback | -74.0 weight in scoring formula | Heavy Ranker |
| Unfollow | Moderate signal, 90-day window | `InteractionGraphNegativeJob` |
| Spam patterns | Grok filters flag and remove | `GrokSpamFilter` |
| NSFW (out-of-network) | Removed entirely | `OutOfNetworkNSFW` |

---

## Project Structure

```
x-post-analyzer/
├── src/
│   ├── cli.js                          # Command-line interface
│   ├── index.js                        # Public API (all exports)
│   ├── analyzer.js                     # Main orchestrator
│   ├── algorithm-weights.js            # Algorithm weights, signals & pipeline config
│   ├── analyzers/
│   │   ├── text-analyzer.js            # Text quality (length, hashtags, spam, etc.)
│   │   ├── reply-strategy-analyzer.js  # Reply hooks & debate triggers
│   │   ├── engagement-predictor.js     # Weighted engagement scoring
│   │   ├── media-analyzer.js           # Media type impact
│   │   └── timing-analyzer.js          # Posting time optimization
│   └── report/
│       └── markdown-report.js          # Markdown report generator
├── test/
│   └── run.js                          # Test suite (28 tests)
├── examples/
│   ├── analyze-example.js              # Single tweet example
│   └── compare-example.js             # Comparison example
├── CLAUDE.md                           # Repeatable analysis skill
├── package.json
└── README.md
```

---

## Tips Cheat Sheet

**Do this:**
- Ask a question at the end of every tweet
- Reply to every single comment (150x a like!)
- Use an image or video (2–2.5x boost)
- Keep tweets 100–250 characters
- Use 0–2 hashtags max
- Post between 8–11 AM ET on weekdays
- Share opinions and hot takes to drive debate
- Use formats like "Agree or disagree:", "Rank these:", "What's your take?"

**Don't do this:**
- Post external links in the main tweet (put them in replies)
- Use 3+ hashtags (spam signal)
- Use 3+ @mentions (spam signal)
- Write in ALL CAPS (spam signal)
- Post tweet-length URLs with no commentary
- Ignore your replies (you're leaving 150x engagement on the table)
- Post late at night (11 PM – 5 AM ET)
- Repeat characters excessively (!!!!! or soooooo)

---

## Contributing

PRs welcome. The algorithm weights may change as Twitter/X updates their systems. If you find updated weights or new signals, open an issue or PR.

## License

MIT

## Sources

- [twitter/the-algorithm](https://github.com/twitter/the-algorithm) — Core recommendation algorithm (Scala/Java)
- [twitter/the-algorithm-ml](https://github.com/twitter/the-algorithm-ml) — Heavy Ranker ML model and weights
