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

X [open-sourced their algorithm](https://github.com/xai-org/x-algorithm). We read all of it. This tool turns those findings into actionable feedback you can use *before* you post.

---

## What the Analyzer Scores

The algorithm scores every tweet across discrete engagement heads. Action names follow [`xai-org/x-algorithm`](https://github.com/xai-org/x-algorithm) (2026). Numeric weights are no longer published upstream; 2023 reference values are retained as legacy estimates.

| Signal | Category | 2023 legacy weight |
|--------|----------|--------------------|
| reply | engagement | 13.5* |
| profile_click | engagement | 12.0* |
| click (detail expand) | engagement | 11.0* |
| repost | engagement | 1.0* |
| favorite | engagement | 0.5* |
| photo_expand | engagement | unpublished |
| quote / quoted_click | engagement | unpublished |
| follow_author | engagement | unpublished |
| share_via_dm / share_via_copy_link | engagement | unpublished |
| dwell_time / scroll_depth | continuous | unpublished |
| vqv (video quality view) | media | 0.005* |
| not_interested | negative | -74.0* |
| block_author | negative | -74.0* |
| mute_author | negative | -74.0* |
| report | negative | -369.0* |

*2023 estimate from `the-algorithm-ml`. Treat as directional, not current.

The `replied_and_engaged_by_author` head (75.0 in 2023) no longer exists as a distinct action upstream. Replying to your commenters still drives reply, follow_author, and profile_click heads simultaneously — it remains the highest-leverage action you can take.

---

## Browser UI

Run `npm run dev` and open http://localhost:8000.
Paste a tweet, optionally paste your XAI_API_KEY to enable Grok analysis, click Analyze.

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
    1. CRITICAL: Reply to EVERY comment. Drives reply + follow_author + profile_click heads simultaneously.
    2. Add line breaks for readability.
    3. Use high-contrast, eye-catching images that stop the scroll.

  Full report saved to: analysis-report.md
```

---

## Optional: Grok API integration

By default the tool uses fast local heuristics for banger prediction, safety classification, and spam detection. Setting `XAI_API_KEY` replaces those heuristics with live Grok calls for higher accuracy.

**What it does**

- Banger predictor — Grok rates novelty, hook, shareability, and signal-to-cliché ratio on a 0–1 scale. Replaces the local bigram/entropy model.
- Safety classifier — Two-pass classification across all 7 PTOS categories. Sensitive categories (`violent_media`, `adult_content`) get a second reasoning pass on `grok-3` when rated medium/high.
- Spam classifier — Grok decides whether reply-bait phrases would trip SpamEasiLowFollowerClassifier, suppressing the warning when it says the tweet is fine.

**How to enable**

Sign up at [https://console.x.ai](https://console.x.ai) and export your key:

```bash
export XAI_API_KEY=xai-...
node src/cli.js "Your tweet here"
```

Set `XAI_API_KEY` in your shell or a local `.env` (gitignored). In CI, inject via your platform's secret manager — never commit a `.env` file.

**Rough cost**

Approximately $1–2 per 1,000 tweets with default mini routing. The `adult_content` and `violent_media` deluxe reasoning pass uses `grok-3` and is only triggered when those categories score medium or high.

**Failure behavior**

Any Grok error (network failure, timeout, non-2xx response) silently falls back to the heuristic analyzer. The `source` field in results will be `'grok'` or `'heuristic'` so you can tell which ran.

---

## How It Works

The tool runs **8 analyzers** on your tweet, each targeting a different part of the algorithm:

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                        Your Tweet Text                         │
 └──────────────────────────┬──────────────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    Text      │  │   Reply      │  │ Neg-Feedback │
│  Analyzer    │  │  Strategy    │  │ Risk (Grox)  │
│              │  │  Analyzer    │  │              │
│ • Length     │  │              │  │ • Slop words │
│ • Hashtags   │  │ • 20+ hooks  │  │ • AI phrases │
│ • URLs       │  │ • 9+ debate  │  │ • Trigrams   │
│ • Caps/spam  │  │   triggers   │  │ • Structure  │
│ • Emojis     │  │ • CTAs       │  │ • Burstiness │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Media      │  │  Engagement  │  │   Timing     │
│  Analyzer    │  │  Predictor   │  │  Analyzer    │
│              │  │              │  │              │
│ • Image 2x   │  │ • Score per  │  │ • Peak hours │
│ • Video 2.5x │  │   engagement │  │ • Weekday vs │
│ • Poll 1.8x  │  │   type       │  │   weekend    │
│ • None 0.7x  │  │ • Algorithm  │  │              │
│              │  │   formula    │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────────────────────────┐
│   Banger     │  │          Grox Safety Risk        │
│  Likelihood  │  │                                  │
│              │  │  7 PTOS categories:              │
│ • Novelty    │  │  violent_media, adult_content,   │
│ • Specificity│  │  spam, illegal_regulated,        │
│ • Hook       │  │  hate_abuse, violent_speech,     │
│ • Shareability│ │  self_harm                       │
│ score >= 0.4 │  │                                  │
└──────┬───────┘  └──────────────────┬───────────────┘
       │                             │
       └──────────────┬──────────────┘
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
| Character length | 75–200 (3–8s dwell window) | Short tweets get ignored, long ones lose dwell |
| Hashtags | 0–2 | 3+ triggers spam detection |
| @mentions | 0–1 | 3+ triggers spam detection |
| External URLs | 0 | Algorithm keeps users on-platform — put links in replies |
| ALL CAPS ratio | < 50% | High caps = spam signal |
| Emojis | ≤ 5 | Excessive = spam signal |
| Repeated chars | None | "!!!!!" and "sooooo" flag as low quality |
| Line breaks | Use them | Readability increases dwell time |

### 2. Reply Strategy Analyzer (Highest Impact)

This is the most important analyzer because replies simultaneously drive multiple engagement heads (reply, follow_author, profile_click). Replying to every commenter remains the highest-leverage action you can take.

It detects 20+ conversation hooks:
- Questions (`What do you think?`, `Which one?`, `How do you...`)
- Debate triggers (`Unpopular opinion`, `Change my mind`, `Agree or disagree?`)
- Engagement CTAs (`Reply with`, `Drop your`, `Wrong answers only`)
- Choice prompts (`A or B?`, `Rank these`, `Fill in the blank`)

And 9+ debate triggers that provoke discussion:
- Provocative claims (`X is overrated`, `X is dead`)
- Authority framing (`Most people don't...`, `Here's the thing...`)
- Directive statements (`Stop doing X`, `Nobody talks about X`)

### 3. Negative-Feedback Risk (Grox Slop Detector)

The algorithm has dedicated slop signals (`SlopAuthorFeature`, `SlopAuthorScoreFeature`, `GrokSlopScoreFeature`, `SlopFilter`) that identify and suppress AI-generated low-quality content. Users also instinctively disengage from robotic text, triggering the not_interested, block_author, mute_author, and report negative heads.

Detection is based on the [Antislop paper](https://arxiv.org/abs/2510.15061) (ICLR 2026) and [EQ-Bench Slop Score](https://eqbench.com/slop-score.html) methodology:

| Component | Weight | What it checks |
|-----------|--------|----------------|
| Slop Words | 60% | Words statistically overrepresented in AI output ("delve" saw ~1000% increase post-ChatGPT) |
| Slop Phrases | 25% | AI-typical patterns ("In today's fast-paced world", "Not just X, but Y", "I'd be happy to help") |
| Slop Trigrams | 15% | 3-word sequences overrepresented in AI text ("a testament to", "a tapestry of") |
| Structural | bonus | Sentence uniformity (low burstiness), adverb stacking, semicolons, formatting bleed |

**Red-flag words** (highest overrepresentation in AI vs. human text):

`delve` · `tapestry` · `multifaceted` · `commendable` · `meticulous` · `intricate` · `pivotal` · `nuanced` · `comprehensive` · `testament` · `paradigm` · `robust` · `unprecedented` · `leverage` · `revolutionize` · `groundbreaking` · `transformative` · `holistic` · `synergy`

**Red-flag phrases:**

- "In today's fast-paced/ever-evolving world..." (instant AI tell)
- "It's important to note..." / "It's worth noting..."
- "Not just X, but Y" (25% of EQ-Bench slop score alone)
- "Great question!" / "I'd be happy to help!" (chatbot bleed)
- "A testament to" / "A tapestry of" (AI superlatives)
- "Let's delve into" / "In the realm of"
- "In summary" / "In conclusion" / "In essence"

**Why it matters:** The X algorithm tracks `SlopAuthorScore` at the account level. Repeatedly posting AI-sounding content can flag your entire account, reducing reach on ALL your tweets — not just the flagged ones.

### 4. Banger Likelihood

Scores positive content quality against a 0.4 threshold. A score below threshold is flagged as low viral potential. Factors:

| Factor | Weight | What it checks |
|--------|--------|----------------|
| Hook strength | 25% | First 12 chars: question, number, contrarian opener |
| Novelty | 20% | Bigram uniqueness + token entropy |
| Specificity | 20% | Named entities, numbers, timeframe anchors |
| Shareability | 20% | Quote-worthy line (30–120 chars, ends with punctuation) |
| Cliche density | 15% | Penalizes "game changer", "let that sink in", "bookmark this", etc. |

### 5. Grox Safety Risk

Checks tweet text against 7 Grox PTOS categories. High-risk matches trigger suppression before the Heavy Ranker even scores the tweet.

| Category | Risk if matched |
|----------|----------------|
| violent_media | Immediate suppression |
| adult_content | Age-gating / suppression |
| spam | SpamEasi classifier escalation |
| illegal_regulated | Removal |
| hate_abuse | Removal |
| violent_speech | Removal |
| self_harm | Safe messaging intervention |

### 6. Media Impact Analyzer

The algorithm treats media types differently:


| Media | Boost | Notes |
|-------|-------|-------|
| Video | ~2.5x | Algorithm tracks 50% watch-through. Keep under 60s. |
| Image | ~2.0x | High-contrast, scroll-stopping images work best |
| Poll | ~1.8x | Voting = interaction = algorithmic signal |
| GIF | ~1.5x | Visual appeal without video commitment |
| None | 0.7x | Text-only gets ~30% less distribution |

### 7. Engagement Predictor

Uses the actual Heavy Ranker formula from `the-algorithm-ml`:

```
score = Σ (weight_i × P(engagement_i))
```

Predicts probability for each of the 15 engagement types the model scores, then calculates weighted contribution to show you exactly where your tweet's score comes from.

### 8. Timing Analyzer

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
| `--low-follower` | Flag account as low-follower (surfaces `SpamEasiLowFollowerClassifier` risk for reply-bait phrasing) |

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
| **Negative-Feedback Risk** | Slop score, flagged words/phrases, structural tells |
| **Banger Likelihood** | Novelty, hook, specificity, shareability, cliche density scores |
| **Grox Safety Risk** | Per-category risk level across 7 PTOS heads |
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
import { analyzeTweet, generateReport, isGrokEnabled } from './src/index.js';

console.log(isGrokEnabled()); // true if XAI_API_KEY is set

const analysis = await analyzeTweet({
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

const comparison = await compareTweets([
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
import { analyzeText, analyzeReplyStrategy, analyzeMedia, detectSlop, bangerPredictor, safetyAnalyzer } from './src/index.js';

// Just check text quality (sync)
const text = analyzeText('Your tweet here');
console.log(text.score, text.issues, text.strengths);

// Just check reply potential (async — uses Grok when XAI_API_KEY is set)
const reply = await analyzeReplyStrategy('Hot take: X is overrated. Agree?');
console.log(reply.reply_score, reply.hooks_found);

// Just check media impact (sync)
const media = analyzeMedia({ hasVideo: true });
console.log(media.boost_factor); // 2.5

// Just check for AI slop (sync)
const slop = detectSlop('Let me delve into this comprehensive framework...');
console.log(slop.slop_score);         // 0-100
console.log(slop.is_likely_ai);       // true/false
console.log(slop.slop_words_found);   // [{ word: 'delve', severity: 'critical' }, ...]
console.log(slop.slop_phrases_found); // [{ name: '...', severity: '...' }, ...]

// Grok-backed classifiers (async; fall back to heuristic when key not set)
const banger = await bangerPredictor('Your tweet here');
console.log(banger.score, banger.source); // source: 'grok' | 'heuristic'

const safety = await safetyAnalyzer('Your tweet here');
console.log(safety); // [{ categoryId, label, risk, source, ... }]
```

---

## The Algorithm

Everything in this tool comes from the algorithm repos:

- **[xai-org/x-algorithm](https://github.com/xai-org/x-algorithm)** — Current upstream (2026). Action names and signal categories are sourced from here. Numeric weights are not published.
- **[twitter/the-algorithm](https://github.com/twitter/the-algorithm)** — Original open-source release (2023, archived). Recommendation pipeline (Scala/Java).
- **[twitter/the-algorithm-ml](https://github.com/twitter/the-algorithm-ml)** — Original Heavy Ranker ML model (Python). Source of 2023 legacy weights.

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
│   │   ├── timing-analyzer.js          # Posting time optimization
│   │   ├── slop-detector.js            # Negative-feedback risk (Grox slop signals)
│   │   ├── banger-predictor.js         # Positive content quality (xalgo 2026, threshold ≥ 0.4)
│   │   └── safety-analyzer.js          # Grox PTOS safety categories (7 heads)
│   ├── grok/
│   │   ├── client.js                   # xAI API client (isEnabled, callGrok, MODELS)
│   │   └── classifiers/
│   │       ├── banger.js               # Grok banger grader
│   │       ├── safety.js               # Two-pass safety classifier (mini + grok-3 deluxe)
│   │       └── spam.js                 # Grok spam/reply-bait classifier
│   └── report/
│       └── markdown-report.js          # Markdown report generator
├── test/
│   └── run.js                          # Test suite (44 tests)
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
- Reply to every single comment (drives reply + follow_author + profile_click heads simultaneously)
- Use an image or video (2–2.5x boost)
- Keep tweets 75–200 characters (3–8s dwell window)
- Use 0–2 hashtags max
- Post between 8–11 AM ET on weekdays
- Share opinions and hot takes to drive debate
- Use formats like "Agree or disagree:", "Rank these:", "What's your take?"

**Don't do this:**
- Post AI-generated text without heavy editing (triggers SlopFilter + negative feedback)
- Use words like "delve", "tapestry", "multifaceted", "robust", "leverage" (AI red flags)
- Start with "In today's fast-paced world" or "It's important to note" (instant AI tell)
- Post external links in the main tweet (put them in replies)
- Use 3+ hashtags (spam signal)
- Use 3+ @mentions (spam signal)
- Write in ALL CAPS (spam signal)
- Post tweet-length URLs with no commentary
- Ignore your replies (you're leaving reply + follow_author + profile_click signal on the table)
- Post late at night (11 PM – 5 AM ET)
- Repeat characters excessively (!!!!! or soooooo)

---

## Contributing

PRs welcome. The algorithm weights may change as Twitter/X updates their systems. If you find updated weights or new signals, open an issue or PR.

## License

MIT

## Sources

- [xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) — Current upstream algorithm (2026). Action names, signal categories, PTOS safety heads.
- [twitter/the-algorithm](https://github.com/twitter/the-algorithm) — Original open-source release (2023). Recommendation pipeline (Scala/Java).
- [twitter/the-algorithm-ml](https://github.com/twitter/the-algorithm-ml) — Heavy Ranker ML model and 2023 legacy weights (Python).
- [sam-paech/antislop-sampler](https://github.com/sam-paech/antislop-sampler) — Antislop framework (ICLR 2026)
- [EQ-Bench Slop Score](https://eqbench.com/slop-score.html) — Slop detection methodology
