# x-post-analyzer

Open-source tool for analyzing X/Twitter posts against the real Twitter algorithm.

## Quick Analysis Skill

When asked to analyze a tweet, run:

```bash
node src/cli.js [options] "tweet text here"
```

### Options
- `--image` / `--video` / `--gif` / `--poll` - specify media type
- `--compare "tweet1" "tweet2"` - compare multiple versions
- `-o report.md` - save report to file
- `-f tweets.txt` - read tweets from file

### What to Check (Priority Order)

1. **Reply triggers** (weight: 13.5-75.0) - Does the tweet ask a question or provoke discussion?
2. **Spam signals** (weight: -74 to -369) - No excessive hashtags, caps, mentions, or links
3. **Media** (2-2.5x boost) - Does it have an image/video?
4. **Text quality** (100-250 chars optimal) - Right length, readable formatting
5. **External links** (penalized) - Links should go in replies, not main tweet
6. **Author engagement** (75.0 weight) - Remind user to reply to ALL comments

### Algorithm Weights Reference

| Type | Weight | vs Like |
|------|--------|---------|
| Author-engaged Reply | 75.0 | 150x |
| Reply | 13.5 | 27x |
| Profile Click | 12.0 | 24x |
| Retweet | 1.0 | 2x |
| Like | 0.5 | 1x |
| Negative Feedback | -74.0 | -148x |
| Report | -369.0 | -738x |
