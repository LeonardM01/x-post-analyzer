import { analyzeTweet } from '/src/analyzer.js';
import { generateReport } from '/src/report/markdown-report.js';
import { mdToHtml } from '/web/md-to-html.js';

const form = document.getElementById('analyze-form');
const tweetInput = document.getElementById('tweet-text');
const apiKeyInput = document.getElementById('api-key');
const saveKeyCheckbox = document.getElementById('save-key');
const clearBtn = document.getElementById('clear-btn');
const resultsSection = document.getElementById('results');

const STORAGE_KEY = 'xai_api_key';

const savedKey = localStorage.getItem(STORAGE_KEY);
if (savedKey) {
  apiKeyInput.value = savedKey;
  saveKeyCheckbox.checked = true;
}

clearBtn.addEventListener('click', () => {
  tweetInput.value = '';
  resultsSection.innerHTML = '';
  tweetInput.focus();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const text = tweetInput.value.trim();
  if (!text) return;

  const mediaValue = form.querySelector('input[name="media"]:checked')?.value ?? 'none';
  const media = mediaValue === 'none' ? {} : { [`has${mediaValue.charAt(0).toUpperCase()}${mediaValue.slice(1)}`]: true };

  const grokApiKey = apiKeyInput.value.trim() || localStorage.getItem(STORAGE_KEY) || undefined;

  if (saveKeyCheckbox.checked && apiKeyInput.value.trim()) {
    localStorage.setItem(STORAGE_KEY, apiKeyInput.value.trim());
  } else if (!saveKeyCheckbox.checked) {
    localStorage.removeItem(STORAGE_KEY);
  }

  resultsSection.innerHTML = '<p class="loading">Analyzing...</p>';

  try {
    const analysis = await analyzeTweet({ text, media }, { grokApiKey });
    const markdown = generateReport(analysis);
    resultsSection.innerHTML = mdToHtml(markdown);
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    resultsSection.innerHTML = `<div class="error">Analysis failed: ${err.message}</div>`;
  }
});
