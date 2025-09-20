const QUESTION_LIMIT = 10, HINT_COST = 20, FIFTY_COST = 30, AVATAR_UNLOCK_COST = 100;
const MOTIVATIONAL_QUOTES = [
  "Don't give up! Every failure is a step to success.",
  "Mistakes are proof you are trying.",
  "Believe in yourself and try again!",
  "Great things take time. Keep going!",
  "Every champion was once a contender that refused to give up.",
  "You learn more from losing than winning.",
  "Try again, you are getting better!",
  "Persistence guarantees that results are inevitable.",
  "Success is not final, failure is not fatal: It is the courage to continue that counts.",
  "Your next attempt could be your best yet!"
];
const state = {
  name: '',
  avatarId: '',
  difficulty: '',
  pool: [],
  index: 0,
  correctCount: 0,
  coins: 0,
  timerVal: 10,
  timerHandle: null,
  used5050: false,
  usedHint: false,
  soundEnabled: true,
  darkMode: false,
  currentView: 'splash',
  unlockedAvatars: []
};
const byId = id => document.getElementById(id);
// --- SOUND FX HELPERS ---
let audioContext;
let funFactTimeout;

// Initialize audio context on first user interaction
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  // Resume audio context if suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function playSFX(id, loop=false) {
  if (!state.soundEnabled) return;
  
  const el = document.getElementById(id);
  if (el) {
    el.loop = loop;
    el.currentTime = 0;
    
    // Add error handling
    const playPromise = el.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error(`Error playing sound ${id}:`, error);
        // Disable sound if there's an error
        state.soundEnabled = false;
        byId('soundOn').classList.remove('active');
        byId('soundOff').classList.add('active');
        localStorage.setItem('soundEnabled', 'false');
        showNotification("Sound disabled due to error");
      });
    }
  }
}
function stopSFX(id) {
  const el = document.getElementById(id);
  if (el) {
    el.pause();
    el.currentTime = 0;
  }
}
// Stop all currently playing sounds
function stopAllSounds() {
  stopSFX('sfxStart');
  stopSFX('sfxTimer');
  stopSFX('sfxCoin');
  stopSFX('sfxChest');
}
// ---
// Sanitize input to prevent XSS
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
// Validate coins from localStorage
function getValidatedCoins() {
  const stored = localStorage.getItem('quizCoins');
  const coins = parseInt(stored || '0', 10);
  if (isNaN(coins) || coins < 0 || coins > 10000) {
    return 0;
  }
  return coins;
}
// Get unlocked avatars from localStorage
function getUnlockedAvatars() {
  const stored = localStorage.getItem('unlockedAvatars');
  return stored ? JSON.parse(stored) : [];
}
// Save unlocked avatar to localStorage
function unlockAvatar(avatarId) {
  if (!state.unlockedAvatars.includes(avatarId)) {
    state.unlockedAvatars.push(avatarId);
    localStorage.setItem('unlockedAvatars', JSON.stringify(state.unlockedAvatars));
  }
}
function updateCoins(amount) {
  state.coins += amount;
  if (state.coins < 0) state.coins = 0;
  localStorage.setItem('quizCoins', String(state.coins));
  byId('coinCount').textContent = state.coins;
  byId('coinCountQuiz').textContent = state.coins;
  byId('coinCountEnd').textContent = state.coins;
  if(amount > 0) {
    // Play coin sound only if not already playing
    const coinAudio = document.getElementById('sfxCoin');
    if (coinAudio && coinAudio.paused) {
      playSFX('sfxCoin');
    }
  }
}
function getAvatarEmoji(id) {
  return ({cat:'🐱', dog:'🐶', owl:'🦉', alien:'👽'}[id] || '🙂');
}
function showView(id) {
  // Stop all sounds when changing views
  stopAllSounds();
  
  // Update current view state
  state.currentView = id;
  
  ['view-splash', 'view-start','view-difficulty','view-quiz','view-end'].forEach(v => {
    const el = byId(v);
    if (!el) return;
    el.style.display = (v === id) ? 'block' : 'none';
  });
  
  // Update user info on different views
  if (id === 'view-difficulty') {
    byId('welcomeText').textContent = `Welcome, ${sanitizeInput(state.name)}!`;
    byId('difficultyAvatar').textContent = getAvatarEmoji(state.avatarId);
  } else if (id === 'view-quiz') {
    byId('headerAvatar').textContent = getAvatarEmoji(state.avatarId);
    byId('headerUsername').textContent = sanitizeInput(state.name);
    byId('coinCountQuiz').textContent = state.coins;
  } else if (id === 'view-end') {
    byId('endAvatar').textContent = getAvatarEmoji(state.avatarId);
    byId('coinCountEnd').textContent = state.coins;
  }
  
  // Handle view-specific audio
  if (id === 'view-start' || id === 'view-end') {
    playSFX('sfxStart');
  } else if (id === 'view-quiz') {
    playSFX('sfxTimer', true);
  }
}
function resetLifelines() {
  state.used5050 = false;
  state.usedHint = false;
  byId('btn5050').classList.remove('used');
  byId('btnHint').classList.remove('used');
}
function startTimer() {
  clearTimer();
  state.timerVal = 10;
  const fill = byId('progressFill');
  if (fill) { fill.style.width = '100%'; fill.classList.remove('lowtime'); }
  state.timerHandle = setInterval(() => {
    state.timerVal--;
    if (fill) {
      fill.style.width = (Math.max(state.timerVal,0) / 10) * 100 + '%';
      if(state.timerVal <= 3){ fill.classList.add('lowtime'); } else { fill.classList.remove('lowtime'); }
    }
    if (state.timerVal <= 0) {
      clearTimer();
      onTimeout();
    }
  }, 1000);
}
function clearTimer() {
  if (state.timerHandle) { clearInterval(state.timerHandle); state.timerHandle = null; }
  stopSFX('sfxTimer');
}
const fallbackQuestions = {
  easy: [
    { q:"2 + 2 = ?", options:["3","4","5","6"], answer:"4", hint:"Even", fact:"2+2=4 — basic math" },
    { q:"Color of the sky?", options:["Blue","Green","Red","Yellow"], answer:"Blue", hint:"Daytime", fact:"Sky appears blue due to scattering" },
    { q:"Which animal barks?", options:["Cat","Dog","Cow","Tiger"], answer:"Dog", hint:"Man's best friend", fact:"Dogs bark to communicate." },
    { q:"Sun rises in?", options:["North","South","East","West"], answer:"East", hint:"Opposite of west", fact:"Because Earth rotates west→east." },
    { q:"How many days in a week?", options:["5","6","7","8"], answer:"7", hint:"Lucky number", fact:"A week has seven days." }
  ],
  medium: [
    { q:"Capital of France?", options:["Berlin","Paris","Rome","Madrid"], answer:"Paris", hint:"City of Light", fact:"Paris is very famous." },
    { q:"Who wrote '1984'?", options:["Orwell","Huxley","Austen","Shakespeare"], answer:"Orwell", hint:"Also wrote Animal Farm", fact:"George Orwell wrote 1984." },
    { q:"Square root of 144?", options:["10","11","12","13"], answer:"12", hint:"A dozen", fact:"12 × 12 = 144." },
    { q:"Gas needed for combustion?", options:["Nitrogen","Oxygen","CO2","Helium"], answer:"Oxygen", hint:"We breathe it", fact:"Oxygen supports fire." },
    { q:"Fastest land animal?", options:["Lion","Cheetah","Elephant","Horse"], answer:"Cheetah", hint:"Spotted cat", fact:"Cheetahs exceed 100 km/h." }
  ],
  hard: [
    { q:"Who developed relativity?", options:["Newton","Einstein","Bohr","Tesla"], answer:"Einstein", hint:"E=mc²", fact:"Einstein proposed relativity." },
    { q:"Atomic number of Oxygen?", options:["6","7","8","9"], answer:"8", hint:"Even number", fact:"Oxygen is atomic number 8." },
    { q:"Speed of light approx?", options:["3×10^8 m/s","3×10^6 m/s","3×10^5 m/s","3×10^7 m/s"], answer:"3×10^8 m/s", hint:"Very fast", fact:"Light is ~300,000 km/s." },
    { q:"Avogadro's number approx?", options:["6.02×10^23","3.14","1.6×10^-19","9.8"], answer:"6.02×10^23", hint:"Huge", fact:"Particles in one mole." },
    { q:"Element with symbol 'Au'?", options:["Silver","Gold","Argon","Platinum"], answer:"Gold", hint:"Precious metal", fact:"Au = Aurum (Latin)." }
  ]
};
let questionBank = {easy:[],medium:[],hard:[]};
let questionsLoaded = false;
async function loadQuestions() {
  if (questionsLoaded) return;
  
  // Show loading indicator
  byId('loadingIndicator').style.display = 'flex';
  
  try {
    const res = await fetch('questions.json');
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    if (data && Array.isArray(data.easy) && Array.isArray(data.medium) && Array.isArray(data.hard)) {
      // Get unique questions without duplicates
      const getUniqueQuestions = (loadedQuestions, fallbackQuestions, minCount) => {
        if (loadedQuestions.length >= minCount) return loadedQuestions.slice(0);
        
        const combined = [...loadedQuestions];
        const fallbackSet = new Set(loadedQuestions.map(q => q.q));
        
        for (const q of fallbackQuestions) {
          if (combined.length >= minCount) break;
          if (!fallbackSet.has(q.q)) {
            combined.push(q);
            fallbackSet.add(q.q);
          }
        }
        
        return combined.slice(0, minCount);
      };
      
      questionBank = {
        easy: getUniqueQuestions(data.easy || [], fallbackQuestions.easy, 5),
        medium: getUniqueQuestions(data.medium || [], fallbackQuestions.medium, 5),
        hard: getUniqueQuestions(data.hard || [], fallbackQuestions.hard, 5)
      };
      questionsLoaded = true;
    } else {
      questionBank = {...fallbackQuestions};
      questionsLoaded = true;
    }
  } catch(e) {
    questionBank = {...fallbackQuestions};
    questionsLoaded = true;
  } finally {
    // Hide loading indicator
    byId('loadingIndicator').style.display = 'none';
  }
}
function getShuffledQuestions(level, count) {
  let arr = questionBank[level].slice();
  shuffleArray(arr);
  
  // Ensure we have enough questions
  if (arr.length < count) {
    console.warn(`Not enough questions in ${level} pool. Using ${arr.length} questions.`);
    count = arr.length;
  }
  
  return arr.slice(0, count);
}
function updateProgress() {
  const total = state.pool.length || 1;
  const current = Math.min(state.index+1, total);
  byId('progressText').textContent = `Question ${current} of ${total}`;
  const progressBar = document.querySelector('.progress-bar');
  if(progressBar) {
    progressBar.setAttribute('aria-valuenow', current);
    progressBar.setAttribute('aria-valuemax', String(total));
  }
}
function onAnswer(btn, selected) {
  const opts = Array.from(document.querySelectorAll('.answer-btn'));
  opts.forEach(b => { b.classList.add('disabled'); b.disabled = true; });
  clearTimer();
  const q = state.pool[state.index];
  const correct = q.answer;
  if (selected === correct) {
    btn.classList.add('correct');
    state.correctCount++;
    updateCoins(10);
    if (q.fact) showFunFact(q.fact);
    setTimeout(() => { state.index++; renderQuestion(); }, 900);
  } else {
    btn.classList.add('wrong');
    opts.forEach(b => { if (b.textContent === correct) b.classList.add('correct'); });
    setTimeout(() => finishGame(false), 900);
  }
}
function onTimeout() {
  const opts = Array.from(document.querySelectorAll('.answer-btn'));
  const q = state.pool[state.index];
  opts.forEach(b => { b.classList.add('disabled'); b.disabled = true; if (b.textContent === q.answer) b.classList.add('correct'); });
  setTimeout(() => finishGame(false), 900);
}
const funFactEl = byId('funFact');
function showFunFact(text, closeAfter = 1600) {
  funFactEl.textContent = text || '';
  funFactEl.classList.add('show');
  funFactEl.setAttribute('aria-hidden','false');
  clearTimeout(funFactTimeout); // Clear existing timeout
  funFactTimeout = setTimeout(() => { 
    funFactEl.classList.remove('show'); 
    funFactEl.setAttribute('aria-hidden','true'); 
  }, closeAfter);
}
// Custom notification system
function showNotification(message, duration = 3000) {
  const notification = document.getElementById('notification');
  const content = notification.querySelector('.notification-content');
  const closeBtn = notification.querySelector('.notification-close');
  
  content.textContent = message;
  notification.classList.add('show');
  notification.setAttribute('aria-live', 'assertive');
  
  const hideNotification = () => {
    notification.classList.remove('show');
  };
  
  closeBtn.onclick = hideNotification;
  
  if (duration > 0) {
    setTimeout(hideNotification, duration);
  }
}
const btn5050El = byId('btn5050');
const btnHintEl = byId('btnHint');
function updateLifelineStates() {
  btn5050El.disabled = state.used5050 || state.coins < 30;
  btnHintEl.disabled = state.usedHint || state.coins < 20;
  if (btn5050El.disabled) btn5050El.classList.add('used');
  else btn5050El.classList.remove('used');
  if (btnHintEl.disabled) btnHintEl.classList.add('used');
  else btnHintEl.classList.remove('used');
}
btn5050El.addEventListener('click', () => {
  if (!state.pool || !state.pool[state.index]) return;
  if (state.used5050 || state.coins < FIFTY_COST) return;
  state.used5050 = true;
  updateLifelineStates();
  updateCoins(-FIFTY_COST);
  const q = state.pool[state.index];
  const opts = Array.from(document.querySelectorAll('.answer-btn'));
  const wrongBtns = opts.filter(b => b.textContent !== q.answer && b.style.visibility !== 'hidden' && !b.classList.contains('disabled'));
  shuffleArray(wrongBtns);
  wrongBtns.slice(0,2).forEach(b => { b.style.visibility = 'hidden'; });
});
btnHintEl.addEventListener('click', () => {
  if (!state.pool || !state.pool[state.index]) return;
  if (state.usedHint || state.coins < HINT_COST) return;
  state.usedHint = true;
  updateLifelineStates();
  updateCoins(-HINT_COST);
  const q = state.pool[state.index];
  showFunFact("Hint: " + (q.hint || "No hint available"), 2200);
});
function saveToLeaderboard(win) {
  const board = JSON.parse(localStorage.getItem('quizLeaderboard') || '[]');
  
  // Validate new entry with timestamp
  const newEntry = {
    name: state.name.substring(0, 50), // Limit name length
    avatar: state.avatarId,
    difficulty: state.difficulty,
    score: Math.max(0, Math.min(state.correctCount, state.pool.length)), // Ensure valid score
    total: state.pool.length,
    win: !!win,
    timestamp: Date.now(), // Add timestamp for sorting
    isCurrent: true // Mark as current game
  };
  
  // Mark all existing entries as not current
  board.forEach(entry => entry.isCurrent = false);
  
  // Add new entry at the beginning
  board.unshift(newEntry);
  
  // Keep only last 5 entries
  const trimmedBoard = board.slice(0, 5);
  localStorage.setItem('quizLeaderboard', JSON.stringify(trimmedBoard));
  
  return newEntry; // Return the new entry for highlighting
}
function renderLeaderboard(currentEntry = null) {
  const list = byId('leaderboardList');
  list.innerHTML = '';
  let board = [];
  
  try {
    board = JSON.parse(localStorage.getItem('quizLeaderboard') || '[]');
    // Validate board entries
    board = board.filter(entry => 
      entry && 
      typeof entry.name === 'string' && 
      typeof entry.score === 'number' && 
      entry.score >= 0
    );
  } catch (e) {
    console.error('Error parsing leaderboard data', e);
  }
  
  if (board.length === 0) {
    list.innerHTML = '<li style="text-align: center; color: var(--muted);">No games played yet</li>';
    return;
  }
  
  board.forEach((entry, index) => {
    const li = document.createElement('li');
    if (entry.isCurrent || (currentEntry && currentEntry.timestamp === entry.timestamp)) {
      li.classList.add('current-game');
    }
    
    li.innerHTML = `
      <div class="leaderboard-entry">
        <span class="leaderboard-avatar">${getAvatarEmoji(entry.avatar)}</span>
        <span class="leaderboard-name">${sanitizeInput(entry.name)}</span>
        <span>(${entry.difficulty.toUpperCase()})</span>
      </div>
      <div>
        <span class="leaderboard-score">${entry.score}/${entry.total}</span>
        ${entry.win ? '<span class="leaderboard-win">✓</span>' : '<span class="leaderboard-loss">✗</span>'}
      </div>
    `;
    list.appendChild(li);
  });
}
function finishGame(win) {
  clearTimer();
  stopSFX('sfxTimer'); // Explicitly stop the timer sound
  funFactEl.classList.remove('show');
  showView('view-end');
  
  const currentEntry = saveToLeaderboard(win);
  
  if (win) {
    byId('endTitle').textContent = `🎉 Congratulations, ${sanitizeInput(state.name)}! You Won!`;
    byId('badge').style.display = 'flex';
    if (!state.used5050 && !state.usedHint) {
      byId('badgeImage').src = 'badgeone.png';
    } else {
      byId('badgeImage').src = 'badgetwo.png';
    }
    byId('rewardChest').style.display = 'block';
    byId('chestImage').classList.remove('opened');
    const openBtn = byId('openChestBtn');
    if (openBtn) {
      openBtn.disabled = false;
      openBtn.classList.remove('faded');
      openBtn.dataset.opened = '0';
    }
    byId('motivationalQuote').textContent = "You're a trivia master!";
  } else {
    byId('endTitle').textContent = `😢 Game Over, ${sanitizeInput(state.name)}`;
    byId('badge').style.display = 'none';
    byId('rewardChest').style.display = 'none';
    byId('motivationalQuote').textContent = MOTIVATIONAL_QUOTES[Math.floor(Math.random()*MOTIVATIONAL_QUOTES.length)];
  }
  byId('playerSummary').textContent = `Score: ${state.correctCount}/${state.pool.length}`;
  renderLeaderboard(currentEntry);
}
function renderQuestion() {
  if (state.index >= state.pool.length) {
    finishGame(true);
    return;
  }
  
  updateProgress();
  const q = state.pool[state.index];
  byId('questionText').textContent = q.q;
  const container = byId('optionsContainer');
  
  // Use a document fragment for better performance
  const fragment = document.createDocumentFragment();
  container.innerHTML = '';
  
  let shuffledOptions = q.options.slice();
  shuffleArray(shuffledOptions);
  
  shuffledOptions.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-label', `Answer option: ${opt}`);
    btn.textContent = opt;
    btn.onclick = () => onAnswer(btn, opt);
    fragment.appendChild(btn);
  });
  
  // Add all buttons at once
  container.appendChild(fragment);
  
  Array.from(container.querySelectorAll('.answer-btn')).forEach(b => { 
    b.style.visibility = 'visible'; 
    b.classList.remove('disabled','correct','wrong'); 
    b.disabled = false; 
  });
  
  byId('headerAvatar').textContent = getAvatarEmoji(state.avatarId);
  byId('headerUsername').textContent = sanitizeInput(state.name);
  byId('coinCountQuiz').textContent = state.coins;
  updateLifelineStates();
  playSFX('sfxTimer', true);
  startTimer();
}
function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Initialize avatar states
function initializeAvatars() {
  state.unlockedAvatars = getUnlockedAvatars();
  
  document.querySelectorAll('.avatar').forEach(a => {
    const avatarId = a.dataset.id;
    
    // Check if avatar is unlocked
    if (state.unlockedAvatars.includes(avatarId)) {
      a.dataset.locked = "false";
      a.removeAttribute('aria-disabled');
    } else if (avatarId !== 'cat' && avatarId !== 'dog') {
      // Only lock owl and alien by default, cat and dog are unlocked
      a.dataset.locked = "true";
      a.setAttribute('aria-disabled', 'true');
    }
    
    a.addEventListener('click', () => {
      if (a.dataset.locked === "true") {
        if (state.coins >= AVATAR_UNLOCK_COST) {
          if (confirm(`Unlock this avatar for ${AVATAR_UNLOCK_COST} coins?`)) {
            updateCoins(-AVATAR_UNLOCK_COST);
            unlockAvatar(avatarId);
            a.dataset.locked = "false";
            a.removeAttribute('aria-disabled');
            a.classList.add('unlocking');
            showNotification("Avatar unlocked!");
            
            // Automatically select the unlocked avatar
            document.querySelectorAll('.avatar').forEach(x => x.classList.remove('selected'));
            a.classList.add('selected');
            state.avatarId = a.dataset.id;
            
            // Remove animation class after animation completes
            setTimeout(() => {
              a.classList.remove('unlocking');
            }, 500);
          }
        } else {
          showNotification("This avatar is locked. Earn more coins to unlock.");
          return;
        }
      } else {
        document.querySelectorAll('.avatar').forEach(x => x.classList.remove('selected'));
        a.classList.add('selected');
        state.avatarId = a.dataset.id;
      }
    });
    
    a.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') a.click();
    });
  });
}
// Start button click handler
function handleStartClick() {
  // Initialize audio context on first user interaction
  initAudioContext();
  
  playSFX('sfxStart');
  if (!state.avatarId) {
    showNotification("Select an avatar first");
    return;
  }
  if (!byId('nameInput').value.trim()) {
    showNotification("Enter your name");
    return;
  }
  state.name = byId('nameInput').value.trim();
  showView('view-difficulty');
}
byId('startBtn').addEventListener('click', handleStartClick);
byId('openChestBtn').addEventListener('click', () => {
  const btn = byId('openChestBtn');
  if (!btn) return;
  if (btn.dataset.opened === '1') return;
  const coinsWon = Math.floor(Math.random() * 41) + 10;
  updateCoins(coinsWon);
  byId('chestImage').classList.add('opened');
  btn.dataset.opened = '1';
  btn.disabled = true;
  btn.classList.add('faded');
  playSFX('sfxChest');
  showNotification(`🎉 You won ${coinsWon} coins!`);
});
// Share functionality
byId('shareBtn').addEventListener('click', () => {
  const shareText = `🎮 I just played Trivia Thief and scored ${state.correctCount}/${state.pool.length}! Can you beat my score, ${state.name}? Challenge yourself at: ${window.location.href}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Trivia Thief Quiz Game',
      text: shareText,
      url: window.location.href
    })
    .then(() => {
      showNotification('Thanks for sharing!');
    })
    .catch(err => {
      console.error('Error sharing:', err);
      // Fallback to clipboard if share is cancelled
      copyToClipboard(shareText);
    });
  } else {
    // Fallback for browsers that don't support Web Share API
    copyToClipboard(shareText);
  }
});
function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      showNotification('Share link copied to clipboard!');
    })
    .catch(err => {
      console.error('Error copying to clipboard:', err);
      showNotification('Unable to share. Please try again.');
    });
}
document.querySelectorAll('#view-difficulty .btn[data-diff]').forEach(btn => btn.addEventListener('click', async () => {
  await loadQuestions();
  state.difficulty = btn.dataset.diff;
  state.pool = getShuffledQuestions(state.difficulty, QUESTION_LIMIT);
  state.index = 0;
  state.correctCount = 0;
  resetLifelines();
  showView('view-quiz');
  renderQuestion();
}));
byId('playAgainBtn').addEventListener('click', () => { showView('view-difficulty'); });
byId('mainMenuBtn').addEventListener('click', () => { showView('view-start'); });
byId('instructionsBtn').addEventListener('click', () => { 
  byId('instructionsModal').style.display = 'flex'; 
});
byId('closeInstructions').addEventListener('click', () => { byId('instructionsModal').style.display = 'none'; });
byId('backToStart').addEventListener('click', () => { 
  showView('view-start'); 
});
// Dark mode toggle
byId('lightMode').addEventListener('click', () => {
  document.body.classList.remove('dark-mode');
  state.darkMode = false;
  byId('lightMode').classList.remove('active');
  byId('darkMode').classList.add('active');
  localStorage.setItem('darkMode', 'false');
});
byId('darkMode').addEventListener('click', () => {
  document.body.classList.add('dark-mode');
  state.darkMode = true;
  byId('darkMode').classList.remove('active');
  byId('lightMode').classList.add('active');
  localStorage.setItem('darkMode', 'true');
});
// Sound toggle
byId('soundOn').addEventListener('click', () => {
  state.soundEnabled = true;
  byId('soundOn').classList.add('active');
  byId('soundOff').classList.remove('active');
  localStorage.setItem('soundEnabled', 'true');
});
byId('soundOff').addEventListener('click', () => {
  state.soundEnabled = false;
  byId('soundOff').classList.add('active');
  byId('soundOn').classList.remove('active');
  localStorage.setItem('soundEnabled', 'false');
  // Stop all currently playing sounds
  stopAllSounds();
});
// Initialize settings from localStorage
state.coins = getValidatedCoins();
state.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
state.darkMode = localStorage.getItem('darkMode') === 'true';
// Apply saved settings
if (state.darkMode) {
  document.body.classList.add('dark-mode');
  byId('darkMode').classList.add('active');
  byId('lightMode').classList.remove('active');
}
if (!state.soundEnabled) {
  byId('soundOn').classList.remove('active');
  byId('soundOff').classList.add('active');
}
byId('coinCount').textContent = state.coins;
byId('coinCountQuiz').textContent = state.coins;
byId('coinCountEnd').textContent = state.coins;
// Initialize avatars
initializeAvatars();
// Show splash screen first, then transition to start screen
window.addEventListener('load', () => {
  showView('view-splash');
  
  // Transition to start screen after 3 seconds
  setTimeout(() => {
    showView('view-start');
  }, 3000);
  
  // Add error handling for audio elements
  ['sfxStart', 'sfxTimer', 'sfxCoin', 'sfxChest'].forEach(id => {
    const audio = document.getElementById(id);
    if (audio) {
      audio.addEventListener('error', (e) => {
        console.error(`Error loading audio file for ${id}:`, e);
        // Disable sound if there's an error
        state.soundEnabled = false;
        byId('soundOn').classList.remove('active');
        byId('soundOff').classList.add('active');
        localStorage.setItem('soundEnabled', 'false');
        showNotification("Sound disabled due to error loading audio files");
      });
    }
  });
});
loadQuestions();
// PWA Functionality
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome from showing the default mini-infobar
  e.preventDefault();
  // Store the event so you can trigger it later
  deferredPrompt = e;
  
  // Check if install button already exists
  if (!document.getElementById('installBtn')) {
    // Create an install button
    const installBtn = document.createElement('button');
    installBtn.id = 'installBtn';
    installBtn.textContent = '📥 Install App';
    installBtn.style.position = 'fixed';
    installBtn.style.bottom = '20px';
    installBtn.style.right = '20px';
    installBtn.style.zIndex = '9999';
    installBtn.style.padding = '10px 15px';
    installBtn.style.background = '#ff9800';
    installBtn.style.color = 'white';
    installBtn.style.border = 'none';
    installBtn.style.borderRadius = '5px';
    installBtn.style.cursor = 'pointer';
    installBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
    // Add click event to trigger install prompt
    installBtn.addEventListener('click', () => {
      installBtn.style.display = 'none';
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install');
        } else {
          console.log('User dismissed the install');
        }
        deferredPrompt = null;
      });
    });
    
    // Append the button to the body
    document.body.appendChild(installBtn);
  }
});
// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => {
        console.log('Service Worker registered', reg);
        
        // Check for updates
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update notification
              showNotification('New version available! Refresh to update.', 5000);
            }
          });
        });
      })
      .catch(err => {
        console.log('SW registration failed:', err);
        // Create a basic service worker if registration fails
        createBasicServiceWorker();
      });
  });
}
// Create a basic service worker if the registration fails
function createBasicServiceWorker() {
  const swContent = `
    self.addEventListener('install', event => {
      self.skipWaiting();
    });
    
    self.addEventListener('activate', event => {
      event.waitUntil(clients.claim());
    });
    
    self.addEventListener('fetch', event => {
      event.respondWith(
        fetch(event.request).catch(() => {
          return caches.match(event.request);
        })
      );
    });
  `;
  
  const blob = new Blob([swContent], { type: 'application/javascript' });
  const swUrl = URL.createObjectURL(blob);
  
  navigator.serviceWorker.register(swUrl)
    .then(reg => console.log('Basic SW registered'))
    .catch(err => console.log('Basic SW registration failed:', err));
}
// Handle app installed event
window.addEventListener('appinstalled', () => {
  showNotification('App installed successfully!', 3000);
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }
});
// Check if the app is running in standalone mode (PWA)
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('App is running in standalone mode');
}