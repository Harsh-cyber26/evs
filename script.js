/* ---------- Tab switching (Home, Problem, AI tool, Impact, Take action) ---------- */
function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('visible'));
  const panel = document.getElementById('tab-' + name);
  if (panel) panel.classList.add('visible');

  document.querySelectorAll('.navlinks a[data-tab]').forEach(l => l.classList.remove('active'));
  const link = document.querySelector('.navlinks a[data-tab="' + name + '"]');
  if (link) link.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.navlinks a[data-tab]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const name = link.dataset.tab;
      history.replaceState(null, '', '#' + name);
      showTab(name);
    });
  });

  const startTab = (location.hash || '#home').replace('#', '');
  showTab(startTab);

  initClassifier();
});

/* ---------- AI water classifier (color-analysis placeholder) ---------- */
function initClassifier() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const previewImg = document.getElementById('previewImg');
  const resultPanel = document.getElementById('resultPanel');
  const disclaimerText = document.getElementById('disclaimerText');
  if (!dropzone) return; // AI tool panel not on this page

  let currentImg = null;

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  });

  function handleFile(file) {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewImg.style.display = 'block';
    currentImg = new Image();
    currentImg.onload = () => resetResult();
    currentImg.src = url;
  }

  function resetResult() {
    resultPanel.innerHTML = '<button class="btn" id="analyzeBtn">Analyze sample</button>';
    document.getElementById('analyzeBtn').addEventListener('click', analyze);
    disclaimerText.style.display = 'none';
  }

  function analyze() {
    if (!currentImg) return;
    const btn = document.getElementById('analyzeBtn');
    btn.disabled = true;
    btn.textContent = 'Analyzing…';

    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const w = 60, h = 60;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(currentImg, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
      r /= count; g /= count; b /= count;

      const brightness = (r + g + b) / 3;
      const greenBrownBias = (g + r) - (2 * b);

      let pollutionScore = 0;
      pollutionScore += Math.max(0, greenBrownBias) * 0.6;
      pollutionScore += Math.max(0, 140 - brightness) * 0.4;
      pollutionScore = Math.min(100, Math.max(0, pollutionScore));

      const clean = pollutionScore < 45;
      const confidence = clean
        ? Math.round(100 - pollutionScore)
        : Math.round(Math.min(100, pollutionScore + 20));

      resultPanel.innerHTML = `
        <div class="verdict ${clean ? 'clean' : 'dirty'}">${clean ? 'Likely clean' : 'Likely contaminated'}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${confidence}%; background:${clean ? 'var(--blue)' : 'var(--amber)'}"></div></div>
        <div class="confidence-label">${confidence}% confidence (heuristic)</div>
        <button class="btn" id="retryBtn" style="background:transparent;color:var(--teal);border:1px solid var(--teal);">Try another photo</button>
      `;
      disclaimerText.style.display = 'block';
      document.getElementById('retryBtn').addEventListener('click', () => {
        previewImg.style.display = 'none';
        currentImg = null;
        resetResult();
      });
    }, 500);
  }
}
