// ── Config ──
const API_URL  = 'https://api.anthropic.com/v1/messages';
const MODEL    = 'claude-sonnet-4-20250514';
const LEN_MAP  = {
  brief:    '2-3 sentences',
  balanced: 'one concise paragraph',
  detailed: '2-3 detailed paragraphs',
};

let selectedLen = 'balanced';

// ── Controls ──
function setLen(btn) {
  document.querySelectorAll('.length-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedLen = btn.dataset.len;
}

function countWords() {
  const t = document.getElementById('input-text').value.trim();
  document.getElementById('wc').textContent = (t ? t.split(/\s+/).length : 0) + ' words';
}

function copyResult() {
  const out = document.getElementById('output');
  if (out.classList.contains('empty') || out.classList.contains('loading')) return;
  navigator.clipboard.writeText(out.textContent).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = '✓ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy', 1500);
  });
}

// ── Error helpers ──
function showError(msg) {
  const e = document.getElementById('error-box');
  e.textContent = '⚠ ' + msg;
  e.style.display = 'block';
}
function hideError() { document.getElementById('error-box').style.display = 'none'; }

// ── Main summarize ──
async function summarize() {
  const text = document.getElementById('input-text').value.trim();
  if (!text || text.split(/\s+/).length < 20) {
    showError('Please enter at least 20 words to summarize.');
    return;
  }

  hideError();
  const btn = document.getElementById('sum-btn');
  btn.disabled = true;
  btn.textContent = 'Summarizing…';

  const out = document.getElementById('output');
  out.className = 'output-body loading';
  out.innerHTML = '<div class="spinner"></div><div class="loading-text">Reading and summarizing…</div>';
  document.getElementById('stats-bar').style.display = 'none';

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Summarize the following text in ${LEN_MAP[selectedLen]}. Be clear, accurate, and capture the main points. Output ONLY the summary, no preamble.\n\n${text}`,
        }],
      }),
    });

    const data    = await res.json();
    if (data.error) throw new Error(data.error.message || 'API error');

    const summary = data.content?.[0]?.text || 'Could not generate summary.';
    out.className = 'output-body';
    out.textContent = summary;

    // Stats
    const origW = text.split(/\s+/).length;
    const sumW  = summary.split(/\s+/).length;
    document.getElementById('orig-words').textContent = origW;
    document.getElementById('sum-words').textContent  = sumW;
    document.getElementById('reduction').textContent  = Math.round((1 - sumW / origW) * 100) + '%';
    document.getElementById('swc').textContent        = sumW + ' words';
    document.getElementById('stats-bar').style.display = 'flex';

  } catch (err) {
    out.className = 'output-body empty';
    out.textContent = 'Your summary will appear here…';
    showError('Error: ' + err.message);
  }

  btn.disabled    = false;
  btn.textContent = '✦ Summarize';
}
