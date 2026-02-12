import './style.css'
import confetti from 'canvas-confetti';

// --- State Management ---
const state = {
  score: 0,
  level: 1,
  currentH: 4,
  currentM: 0,
  targetH: 0,
  targetM: 0,
  isDragging: null,

  // New state for flow control
  currentScreen: 'menu', // 'menu', 'game', 'result'
  questionCount: 0,      // Number of questions answered/current (1-10)
  totalQuestions: 10,
};

// --- Constants ---
const LEVELS = [
  { id: 1, label: 'レベル 1', description: 'なんじ ちょうどの もんだい！' },
  { id: 2, label: 'レベル 2', description: 'なんじ はん (30ぷん) の もんだい！' },
  { id: 3, label: 'レベル 3', description: 'なんじ 45ふん の もんだい！' },
  { id: 4, label: 'レベル 4', description: 'いろんな じかん が でるよ！' },
];

function init() {
  renderMenu();
}

// --- Menu Screen ---
function renderMenu() {
  const app = document.querySelector('#app');
  let buttonsHtml = LEVELS.map(level => `
    <button class="level-btn" data-level="${level.id}">
      <span class="level-name">${level.label}</span>
      <span class="level-desc">${level.description}</span>
    </button>
  `).join('');

  app.innerHTML = `
    <div class="menu-container">
      <h1 class="menu-title">とけい アドベンチャー</h1>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${buttonsHtml}
      </div>
    </div>
  `;

  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.onclick = () => {
      const levelId = parseInt(btn.dataset.level);
      startGame(levelId);
    };
  });
}

function startGame(levelId) {
  state.level = levelId;
  state.score = 0;
  state.questionCount = 1;
  state.currentScreen = 'game';

  renderGame();
  generateNewQuestion();
  setupEventListeners();
}

// --- Game Screen ---
function renderGame() {
  const app = document.querySelector('#app');
  const levelInfo = LEVELS.find(l => l.id === state.level);

  app.innerHTML = `
    <div class="header">
      <div class="level-badge" id="level-label">${levelInfo.label}</div>
      <div class="stats-container">
        <div class="score-display">とくてん: <span id="score-count">${state.score}</span></div>
      </div>
    </div>
    
    <div class="progress-container">
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="progress-bar" style="width: 10%"></div>
      </div>
      <div class="progress-text"><span id="q-current">1</span>/10 はん</div>
    </div>

    <div class="question-panel">
      <div class="question-text">つぎの じかんに 合わせてね！</div>
      <div class="target-time" id="target-display">--:--</div>
    </div>

    <div class="clock-container">
      <svg class="clock-svg" viewBox="0 0 400 400">
        <circle cx="200" cy="200" r="190" class="clock-face" />
        ${renderTicks()}
        ${renderNumbers()}
        <line id="hour-hand" x1="200" y1="200" x2="200" y2="100" class="clock-hand hand-hour" />
        <line id="minute-hand" x1="200" y1="200" x2="200" y2="50" class="clock-hand hand-minute" />
        <circle cx="200" cy="200" r="8" class="center-pin" />
      </svg>
    </div>

    <div class="controls">
      <button class="btn btn-primary" id="submit-btn">これで よし！</button>
    </div>

    <div class="overlay" id="overlay">
      <div class="feedback-msg" id="feedback-msg">せいかい！</div>
      <div id="feedback-sub" style="font-size: 1.5rem">よくできました！</div>
      <div id="correct-clock-container"></div>
    </div>
  `;

  updateClockDisplay();
}

function renderNumbers() {
  let html = '';
  for (let i = 1; i <= 12; i++) {
    const angle = (i * 30) * (Math.PI / 180);
    const x = 200 + 145 * Math.sin(angle);
    const y = 200 - 145 * Math.cos(angle);
    html += `<text x="${x}" y="${y}" class="clock-number">${i}</text>`;
  }
  return html;
}

function renderTicks() {
  let html = '';
  for (let i = 0; i < 60; i++) {
    const angle = (i * 6) * (Math.PI / 180);
    const isFive = i % 5 === 0;
    const innerR = isFive ? 175 : 180;
    const outerR = 190;
    const x1 = 200 + innerR * Math.sin(angle);
    const y1 = 200 - innerR * Math.cos(angle);
    const x2 = 200 + outerR * Math.sin(angle);
    const y2 = 200 - outerR * Math.cos(angle);
    html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
      stroke="${isFive ? '#2d3748' : '#a0aec0'}" 
      stroke-width="${isFive ? 3 : 1}" />`;
  }
  return html;
}

// --- Logic ---
function generateNewQuestion() {
  let h = Math.floor(Math.random() * 12) + 1;
  let m = 0;

  if (state.level === 1) {
    m = 0;
  } else if (state.level === 2) {
    m = 30;
  } else if (state.level === 3) {
    m = 45; // Fixed 45 mins as requested
  } else {
    m = Math.floor(Math.random() * 60);
  }

  state.targetH = h;
  state.targetM = m;

  // Random start position for hands to make it a game
  state.currentH = Math.floor(Math.random() * 12) + 1;
  state.currentM = Math.floor(Math.random() * 12) * 5;
  updateClockDisplay();

  let timeStr = '';
  if (m === 0) {
    timeStr = 'ちょうど';
  } else if (m === 30) {
    timeStr = 'はん';
  } else {
    timeStr = m + 'ふん';
  }
  document.getElementById('target-display').textContent = `${h}じ ${timeStr}`;

  // Update progress
  updateProgressUI();
}

function updateProgressUI() {
  const progressBar = document.getElementById('progress-bar');
  const qCurrent = document.getElementById('q-current');
  if (progressBar && qCurrent) {
    const pct = (state.questionCount / 10) * 100;
    progressBar.style.width = `${pct}%`;
    qCurrent.textContent = state.questionCount;
  }
}

function updateClockDisplay() {
  const hDeg = (state.currentH % 12) * 30 + (state.currentM / 60) * 30;
  const mDeg = state.currentM * 6;
  const hourHand = document.getElementById('hour-hand');
  const minuteHand = document.getElementById('minute-hand');

  if (hourHand && minuteHand) {
    hourHand.setAttribute('transform', `rotate(${hDeg} 200 200)`);
    minuteHand.setAttribute('transform', `rotate(${mDeg} 200 200)`);
  }
}

function setupEventListeners() {
  const svg = document.querySelector('.clock-svg');
  const submitBtn = document.getElementById('submit-btn');
  if (!svg || !submitBtn) return;

  const handleMove = (e) => {
    if (!state.isDragging) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI) + 90;
    const normalizedAngle = (angle + 360) % 360;

    if (state.isDragging === 'minute') {
      let m = Math.round(normalizedAngle / 6) % 60;
      state.currentM = m;
    } else if (state.isDragging === 'hour') {
      let h = Math.round(normalizedAngle / 30);
      if (h === 0) h = 12;
      state.currentH = h;
    }
    updateClockDisplay();
  };

  const startDrag = (type) => { state.isDragging = type; };
  const stopDrag = () => { state.isDragging = null; };

  const hHand = document.getElementById('hour-hand');
  const mHand = document.getElementById('minute-hand');

  if (hHand && mHand) {
    hHand.onmousedown = () => startDrag('hour');
    mHand.onmousedown = () => startDrag('minute');
    hHand.ontouchstart = () => startDrag('hour');
    mHand.ontouchstart = () => startDrag('minute');
  }

  window.addEventListener('mousemove', handleMove);
  window.addEventListener('touchmove', handleMove, { passive: false });
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);

  submitBtn.onclick = checkAnswer;
}

function generateMiniClockHtml(h, m) {
  const hDeg = (h % 12) * 30 + (m / 60) * 30;
  const mDeg = m * 6;
  return `
    <svg class="clock-svg mini-clock" viewBox="0 0 400 400">
      <circle cx="200" cy="200" r="190" class="clock-face" />
      ${renderTicks()}
      ${renderNumbers()}
      <line x1="200" y1="200" x2="200" y2="100" class="clock-hand hand-hour" transform="rotate(${hDeg} 200 200)" />
      <line x1="200" y1="200" x2="200" y2="50" class="clock-hand hand-minute" transform="rotate(${mDeg} 200 200)" />
      <circle cx="200" cy="200" r="8" class="center-pin" />
    </svg>
  `;
}

function checkAnswer() {
  const isCorrectM = state.currentM === state.targetM;
  const isCorrectH = (state.currentH % 12) === (state.targetH % 12);
  const overlay = document.getElementById('overlay');
  const feedbackMsg = document.getElementById('feedback-msg');
  const feedbackSub = document.getElementById('feedback-sub');

  // Logic for correctness
  let isCorrect = isCorrectH && isCorrectM;

  if (isCorrect) {
    state.score += 10;
    feedbackMsg.textContent = 'せいかいだよっ！';
    feedbackMsg.classList.add('neon-effect');
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    feedbackSub.textContent = 'そのちょうし！';
    document.getElementById('correct-clock-container').innerHTML = '';
    document.getElementById('score-count').textContent = state.score;
  } else {
    feedbackMsg.textContent = 'おしい！ 😢';
    feedbackMsg.classList.remove('neon-effect');
    feedbackSub.textContent = 'せいかいは この じかん だよ 👇';
    const container = document.getElementById('correct-clock-container');
    container.innerHTML = generateMiniClockHtml(state.targetH, state.targetM);
  }

  overlay.classList.add('show');

  setTimeout(() => {
    overlay.classList.remove('show');
    feedbackMsg.classList.remove('neon-effect');

    // Check if game over (10 questions)
    if (state.questionCount >= 10) {
      showResultScreen();
    } else {
      state.questionCount++;
      generateNewQuestion();
      document.getElementById('correct-clock-container').innerHTML = '';
    }
  }, 2500);
}

function showResultScreen() {
  const app = document.querySelector('#app');
  app.innerHTML = `
    <div class="result-container">
      <div class="result-header">おつかれさま！</div>
      <div class="result-msg">ぜんぶで 10もん おわったよ</div>
      <div class="result-score">${state.score}てん</div>
      <button class="btn-restart" id="restart-btn">もういちど あそぶ</button>
      <button class="btn-restart" id="menu-btn" style="background:#4a5568;color:#fff;margin-top:0.5rem">メニューへ もどる</button>
    </div>
  `;

  // Fire big confetti
  const duration = 3000;
  const end = Date.now() + duration;
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());

  document.getElementById('restart-btn').onclick = () => {
    startGame(state.level);
  };

  document.getElementById('menu-btn').onclick = () => {
    renderMenu();
  };
}

init();
