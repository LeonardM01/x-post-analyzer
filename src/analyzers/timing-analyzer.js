/**
 * Timing Analyzer - Evaluates posting time and its impact on engagement
 * The algorithm factors in recency heavily in the "For You" feed
 */

/**
 * Optimal posting windows (UTC) based on engagement data
 */
const PEAK_HOURS_UTC = {
  weekday: [
    { start: 12, end: 15, label: 'US Morning (8-11 AM ET)', boost: 1.3 },
    { start: 16, end: 19, label: 'US Afternoon (12-3 PM ET)', boost: 1.2 },
    { start: 21, end: 24, label: 'US Evening (5-8 PM ET)', boost: 1.15 },
    { start: 7, end: 9, label: 'EU Morning (8-10 AM CET)', boost: 1.1 },
  ],
  weekend: [
    { start: 14, end: 18, label: 'US Late Morning - Afternoon', boost: 1.2 },
    { start: 20, end: 23, label: 'US Evening', boost: 1.15 },
  ],
};

/**
 * Analyze posting timing
 */
export function analyzeTiming(postDate = null) {
  const findings = {
    score: 0,
    issues: [],
    strengths: [],
    suggestions: [],
    optimal_times: [],
  };

  // Always provide general timing advice
  findings.suggestions.push(
    'Best times to post (ET): Weekdays 8-11 AM, 12-3 PM. The algorithm weights recency heavily.'
  );
  findings.suggestions.push(
    'Post when your target audience is most active. The first 30-60 minutes of engagement heavily determines reach.'
  );
  findings.suggestions.push(
    'Avoid posting late at night (11 PM - 5 AM ET) unless targeting international audiences.'
  );

  findings.optimal_times = [
    { time: '8:00 AM - 11:00 AM ET (Weekdays)', quality: 'Best' },
    { time: '12:00 PM - 3:00 PM ET (Weekdays)', quality: 'Great' },
    { time: '5:00 PM - 8:00 PM ET (Weekdays)', quality: 'Good' },
    { time: '10:00 AM - 2:00 PM ET (Weekends)', quality: 'Good' },
  ];

  if (postDate) {
    const date = new Date(postDate);
    const utcHour = date.getUTCHours();
    const dayOfWeek = date.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const windows = isWeekend ? PEAK_HOURS_UTC.weekend : PEAK_HOURS_UTC.weekday;
    const matchedWindow = windows.find((w) => utcHour >= w.start && utcHour < w.end);

    if (matchedWindow) {
      findings.score = 15;
      findings.strengths.push(`Posted during peak window: ${matchedWindow.label} (${matchedWindow.boost}x engagement boost).`);
    } else {
      findings.score = 5;
      findings.issues.push({
        severity: 'low',
        message: 'Posted outside peak engagement windows.',
      });
    }
  } else {
    findings.score = 10; // Neutral when no time specified
  }

  return findings;
}
