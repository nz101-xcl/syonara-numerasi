// =========================================================================
// SYANORA — INTELLIGENT TUTORING SYSTEM (FILE script.js UTUH & LENGKAP)
// =========================================================================

const PUBLIC_PRODUCTION_URL = "https://syanora.vercel.app";

// 1. DAFTAR PENGGUNA BAWAAN (Siswa = PIN 101 | Guru & Validator = PIN 0808 | musyhapmiwa = Bebas)
const BASE_USERS = {
  "musyhapmiwa": { name: "Musyhap Miwa", school: "Peneliti Utama SYANORA", gender: "Perempuan", pin: "*", role: "researcher", roleLabel: "Peneliti Utama", hobby: "Berkuda", univ: "Universitas Sriwijaya", ig: "@musyhapmiwa" },
  "miwa02": { name: "Miwa", school: "SMA Negeri 1 Palembang", gender: "Perempuan", pin: "0808", role: "teacher", roleLabel: "Guru Matematika", hobby: "Membaca & Literasi", univ: "Universitas Sriwijaya", ig: "@miwa.teacher" },
  "mumu02": { name: "Mumu", school: "SMA Negeri 1 Palembang", gender: "Laki-laki", pin: "0808", role: "teacher", roleLabel: "Guru Matematika", hobby: "Bulu Tangkis", univ: "Institut Teknologi Bandung", ig: "@mumu.teacher" },
  "weni01": { name: "Weni", school: "Validator Ahli SYANORA", gender: "Perempuan", pin: "0808", role: "validator", roleLabel: "Dosen / Validator", hobby: "Membaca & Literasi", univ: "Universitas Sriwijaya", ig: "@unsri" },
  "somakim01": { name: "Dr. Somakim", school: "Universitas Sriwijaya", gender: "Laki-laki", pin: "0808", role: "validator", roleLabel: "Dosen / Validator", hobby: "Membaca & Literasi", univ: "Universitas Sriwijaya", ig: "@unsri" },
  "puja03": { name: "PUJA TERESSA FAWENSI", school: "SMA Negeri 1 Palembang", gender: "Perempuan", pin: "101", role: "student", roleLabel: "Siswa", hobby: "Membaca & Literasi", univ: "Universitas Sriwijaya", ig: "@pujateressa" },
  "choirunisa03": { name: "Choirunisa", school: "SMA Negeri 1 Palembang", gender: "Perempuan", pin: "101", role: "student", roleLabel: "Siswa", hobby: "Memasak & Kuliner", univ: "Universitas Gadjah Mada", ig: "@choirunisa" },
  "rahmat03": { name: "Rahmat", school: "SMA Negeri 1 Palembang", gender: "Laki-laki", pin: "101", role: "student", roleLabel: "Siswa", hobby: "Sepak Bola / Futsal", univ: "Universitas Sriwijaya", ig: "@rahmat03" },
  "ocen03": { name: "Ocen", school: "SMA Negeri 1 Palembang", gender: "Laki-laki", pin: "101", role: "student", roleLabel: "Siswa", hobby: "Bulu Tangkis", univ: "Institut Teknologi Bandung", ig: "@ocen03" }
};

function normalizeKey(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function detectRoleBySuffix(rawUsername) {
  const clean = normalizeKey(rawUsername);
  if (clean === 'musyhapmiwa') {
    return { role: 'researcher', roleLabel: 'Peneliti Utama', defaultPin: '*', defaultSchool: 'Peneliti SYANORA' };
  }
  if (clean.endsWith('01') || clean.includes('somakim')) {
    return { role: 'validator', roleLabel: 'Dosen / Validator', defaultPin: '0808', defaultSchool: 'Universitas Sriwijaya' };
  }
  if (clean.endsWith('02') || clean === 'miwa' || clean === 'mumu') {
    return { role: 'teacher', roleLabel: 'Guru Matematika', defaultPin: '0808', defaultSchool: 'SMA Negeri 1 Palembang' };
  }
  return { role: 'student', roleLabel: 'Siswa', defaultPin: '101', defaultSchool: 'SMA Negeri 1 Palembang' };
}

function getRoleBadgeIconSVG(role) {
  if (role === 'researcher') {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="#7c3aed" title="Peneliti Utama"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  if (role === 'validator') {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="#059669" title="Dosen / Validator (01)"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  }
  if (role === 'teacher') {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="#d97706" title="Guru Matematika (02)"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
  }
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="#4f46e5" title="Akun Siswa (03)"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
}

function getRegisteredUsers() {
  const customUsers = JSON.parse(localStorage.getItem('SYANORA_EXCEL_STUDENTS') || '{}');
  return { ...BASE_USERS, ...customUsers };
}

let currentUser = null;
let activePageId = 'page-home';
let aiHelpCounter = 0;
let attemptCounter = 0;
let lastUserMathQuestion = "cara membedakan penggunaan rumus Un dan Sn";

// 2. DATABASE TERPUSAT (MEREKAM NILAI, RESET MAKS 3X, DISKUSI, LOG, & KOMENTAR SISWA)
function getMasterDatabase() {
  const defaultDB = {
    scores: {
      "puja03": { username: "puja03", name: "PUJA TERESSA FAWENSI", roleLabel: "Siswa", school: "SMA Negeri 1 Palembang", casesDone: 5, gameScore: 650, utama: 100, tambahan: 100, pr: 100, duration: "02:15", resetCount: 0, resetNote: "Belum pernah reset (0/3)", comment: "Sistem SYANORA dan petunjuk bertahap ZETA sangat membantu memahami deret aritmetika." },
      "rahmat03": { username: "rahmat03", name: "Rahmat", roleLabel: "Siswa", school: "SMA Negeri 1 Palembang", casesDone: 0, gameScore: 0, utama: 0, tambahan: 0, pr: 0, duration: "00:00", resetCount: 0, resetNote: "Belum pernah reset (0/3)", comment: "-" },
      "ocen03": { username: "ocen03", name: "Ocen", roleLabel: "Siswa", school: "SMA Negeri 1 Palembang", casesDone: 0, gameScore: 0, utama: 0, tambahan: 0, pr: 0, duration: "00:00", resetCount: 0, resetNote: "Belum pernah reset (0/3)", comment: "-" }
    },
    discussions: [
      { time: "08:00", username: "mumu02", name: "Mumu (Guru Matematika)", message: "Selamat datang di Ruang Diskusi SYANORA! Silakan diskusikan langkah penyelesaian Barisan dan Deret Aritmetika di sini.", attachment: "-" }
    ],
    logs: [
      { time: "08:05", id: "puja03", name: "PUJA TERESSA FAWENSI", roleLabel: "Siswa", module: "Login Sistem", answer: "Berhasil masuk", status: "Aktif" }
    ]
  };
  return JSON.parse(localStorage.getItem('SYANORA_MASTER_DB') || JSON.stringify(defaultDB));
}

function saveMasterDatabase(db) {
  localStorage.setItem('SYANORA_MASTER_DB', JSON.stringify(db));
  renderAllAdminScreens();
  updateTopProfileHud();
}

function ensureUserScoreEntry(uid) {
  const db = getMasterDatabase();
  if (!db.scores[uid]) {
    db.scores[uid] = {
      username: uid,
      name: currentUser ? currentUser.name : uid,
      roleLabel: currentUser ? currentUser.roleLabel : "Siswa",
      school: currentUser ? (currentUser.school || "SMA") : "SMA",
      casesDone: 0,
      gameScore: 0,
      utama: 0,
      tambahan: 0,
      pr: 0,
      duration: "00:00",
      resetCount: 0,
      resetNote: "Belum pernah reset (0/3)",
      comment: "-"
    };
    localStorage.setItem('SYANORA_MASTER_DB', JSON.stringify(db));
  }
  return db;
}

function updateStudentScoreRecord(field, value) {
  if (!currentUser) return;
  const uid = currentUser.id;
  const db = ensureUserScoreEntry(uid);
  db.scores[uid].name = currentUser.name;
  db.scores[uid].school = currentUser.school || "SMA";
  db.scores[uid][field] = value;
  saveMasterDatabase(db);
}

function recordLog(moduleName, answerVal, statusText) {
  const db = getMasterDatabase();
  db.logs.unshift({
    time: new Date().toLocaleTimeString('id-ID'),
    id: currentUser ? currentUser.id : '-',
    name: currentUser ? currentUser.name : '-',
    roleLabel: currentUser ? (currentUser.roleLabel || 'Pengguna') : '-',
    module: moduleName,
    answer: String(answerVal),
    status: statusText
  });
  saveMasterDatabase(db);
}

function updateTopProfileHud() {
  if (!currentUser) return;
  const uid = currentUser.id;
  const db = ensureUserScoreEntry(uid);
  const rec = db.scores[uid];

  const nameEl = document.getElementById('hud-user-name');
  const schoolEl = document.getElementById('hud-user-school');
  if (nameEl) nameEl.textContent = currentUser.name;
  if (schoolEl) schoolEl.textContent = currentUser.school || 'SMA Negeri 1 Palembang';

  const savedImg = localStorage.getItem(`SYANORA_AVATAR_${uid}`);
  const hudAvatar = document.getElementById('hud-avatar-box');
  if (hudAvatar) {
    if (savedImg) {
      hudAvatar.innerHTML = `<img src="${savedImg}" alt="Profil">`;
    } else {
      hudAvatar.textContent = (currentUser.name || 'S').charAt(0).toUpperCase();
    }
  }

  const totalScore = Math.round((rec.utama + rec.tambahan + rec.pr) / 3) || rec.utama || 0;
  const scoreEl = document.getElementById('hud-user-score');
  if (scoreEl) scoreEl.textContent = `${totalScore} / 100 (${rec.gameScore} XP)`;

  const rCount = rec.resetCount || 0;
  const noteEl = document.getElementById('hud-reset-note');
  if (noteEl) noteEl.textContent = `Reset Pembelajaran: ${rCount} / 3`;

  const resetBtn = document.getElementById('reset-learning-btn');
  if (resetBtn) {
    resetBtn.disabled = (rCount >= 3);
    resetBtn.textContent = rCount >= 3 ? 'Batas Reset Habis (3/3)' : 'Reset Pembelajaran';
  }
}

// FITUR RESET PEMBELAJARAN (MAKSIMAL 3X & TERCATAT DI SEMUA PIHAK)
const resetLearningBtn = document.getElementById('reset-learning-btn');
if (resetLearningBtn) {
  resetLearningBtn.addEventListener('click', () => {
    if (!currentUser) return;
    const uid = currentUser.id;
    const db = ensureUserScoreEntry(uid);
    const rec = db.scores[uid];
    const curReset = rec.resetCount || 0;

    if (curReset >= 3) {
      alert('Batas pengulangan (Reset Pembelajaran) maksimal 3 kali telah habis.');
      return;
    }

    const confirmReset = confirm(`Apakah kamu yakin ingin mereset ulang pembelajaranmu dari awal?\n\nCatatan: Ini adalah pengulangan ke-${curReset + 1} dari batas maksimal 3 kali. Riwayat reset ini tercatat pada Rapor Siswa serta Database Guru, Dosen Validator, dan Peneliti.`);
    if (!confirmReset) return;

    const newReset = curReset + 1;
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    rec.resetCount = newReset;
    rec.casesDone = 0;
    rec.gameScore = 0;
    rec.utama = 0;
    rec.tambahan = 0;
    rec.pr = 0;
    rec.duration = "00:00";
    rec.resetNote = `Siswa mereset pembelajaran ${newReset}x (Terakhir pukul ${nowStr})`;

    saveMasterDatabase(db);
    recordLog('RESET PEMBELAJARAN', `Siswa ${currentUser.name} mereset pembelajaran (Pengulangan ke-${newReset} dari 3)`, `Reset ${newReset}/3`);

    unlockedCaseMax = 0;
    loadNumeracyCase(0);
    gameScore = 0;
    gameStreak = 0;
    loadGameLevel(0);
    practiceSeconds = 0;
    isPracticeFinished = false;
    document.getElementById('practice-workspace').hidden = false;
    document.getElementById('final-report-card').hidden = true;
    loadPracticeQuestion(0);
    updateTopProfileHud();
    playSoundEffect('shock');
    alert(`Pembelajaran berhasil direset (Pengulangan ke-${newReset} dari 3).`);
  });
}

function renderAllAdminScreens() {
  const db = getMasterDatabase();

  const scoresTbody = document.getElementById('admin-scores-tbody');
  if (scoresTbody) {
    const rows = Object.values(db.scores);
    scoresTbody.innerHTML = rows.map((s, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${s.username}</strong></td>
        <td>${s.name}</td>
        <td>${s.school}</td>
        <td>${s.casesDone} / 5</td>
        <td><strong>${s.gameScore}</strong></td>
        <td><strong>${s.utama}</strong></td>
        <td><strong>${s.tambahan}</strong></td>
        <td><strong>${s.pr}</strong></td>
        <td><span style="color:${(s.resetCount || 0) > 0 ? '#be123c' : '#475569'}; font-weight:700;">${s.resetNote || 'Belum pernah reset (0/3)'}</span></td>
        <td><em>${s.comment || '-'}</em></td>
      </tr>
    `).join('');
  }

  const discTbody = document.getElementById('admin-discussions-tbody');
  if (discTbody) {
    discTbody.innerHTML = db.discussions.map((d, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${d.time}</td>
        <td><strong>${d.username}</strong></td>
        <td>${d.name}</td>
        <td>${d.message}</td>
        <td>${d.attachment}</td>
      </tr>
    `).join('');
  }

  const logTbody = document.getElementById('diagnostic-log-body');
  if (logTbody) {
    logTbody.innerHTML = db.logs.map(l => `
      <tr>
        <td>${l.time}</td>
        <td><strong>${l.id}</strong></td>
        <td>${l.name}</td>
        <td>${l.module}</td>
        <td>${l.answer}</td>
        <td><strong>${l.status}</strong></td>
      </tr>
    `).join('');
  }

  const regTbody = document.getElementById('registered-users-tbody');
  if (regTbody) {
    const allUsers = getRegisteredUsers();
    regTbody.innerHTML = Object.keys(allUsers).map((k, i) => {
      const u = allUsers[k];
      return `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${k}</strong></td>
          <td>${u.name}</td>
          <td>${u.roleLabel || 'Siswa'}</td>
          <td><code>${u.pin === '*' ? 'Bebas (Peneliti)' : u.pin}</code></td>
        </tr>
      `;
    }).join('');
  }
}

document.querySelectorAll('#admin-screen-tabs .case-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#admin-screen-tabs .case-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const targetScreen = btn.getAttribute('data-screen');
    document.querySelectorAll('.admin-screen-pane').forEach(pane => {
      pane.hidden = (pane.id !== targetScreen);
    });
    playSoundEffect('click');
  });
});

// 3. AUDIO KLASIK MOZART & EFEK SUARA BENAR / SALAH
let musicEnabled = true;
let audioCtx = null;
let bgmTimer = null;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

const MOZART_MELODY = [
  { f: 392.00, d: 0.35 }, { f: 293.66, d: 0.25 }, { f: 392.00, d: 0.35 }, { f: 293.66, d: 0.25 },
  { f: 392.00, d: 0.22 }, { f: 293.66, d: 0.22 }, { f: 392.00, d: 0.22 }, { f: 493.88, d: 0.22 },
  { f: 587.33, d: 0.55 }, { f: 523.25, d: 0.35 }, { f: 440.00, d: 0.25 }, { f: 523.25, d: 0.35 },
  { f: 440.00, d: 0.25 }, { f: 523.25, d: 0.22 }, { f: 440.00, d: 0.22 }, { f: 369.99, d: 0.22 },
  { f: 440.00, d: 0.22 }, { f: 293.66, d: 0.55 }
];
let mozartNoteIndex = 0;

function startMozartClassicalMusic() {
  if (bgmTimer) clearInterval(bgmTimer);
  bgmTimer = setInterval(() => {
    if (!musicEnabled) return;
    try {
      initAudio();
      const note = MOZART_MELODY[mozartNoteIndex % MOZART_MELODY.length];
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(note.f, now);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + note.d + 0.15);
      osc.start(now);
      osc.stop(now + note.d + 0.15);
      mozartNoteIndex++;
    } catch (e) {}
  }, 520);
}

document.addEventListener('click', () => {
  if (musicEnabled && currentUser) initAudio();
}, { once: false });

function playSoundEffect(type = 'success') {
  try {
    initAudio();
    const now = audioCtx.currentTime;
    if (type === 'success') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.16, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);
        osc.start(now + idx * 0.07); osc.stop(now + idx * 0.07 + 0.28);
      });
    } else if (type === 'shock') {
      [220, 165].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.15, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.22);
        osc.start(now + idx * 0.14); osc.stop(now + idx * 0.14 + 0.22);
      });
    } else {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now); osc.stop(now + 0.07);
    }
  } catch (e) {}
}

document.getElementById('music-toggle-btn').addEventListener('click', (e) => {
  musicEnabled = !musicEnabled;
  e.target.textContent = musicEnabled ? 'Musik Klasik: Aktif' : 'Musik Klasik: Nonaktif';
  playSoundEffect('click');
});

// 4. AUTENTIKASI LOGIN & PENDAFTARAN SISWA OTOMATIS
const authOverlay = document.getElementById('auth-overlay');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const guideModal = document.getElementById('guide-modal');

function registerStudentList(nameArray, sourceLabel = 'Excel/CSV') {
  const customStudents = JSON.parse(localStorage.getItem('SYANORA_EXCEL_STUDENTS') || '{}');
  const db = getMasterDatabase();
  let addedCount = 0;

  nameArray.forEach(raw => {
    if (!raw) return;
    const cleanStr = String(raw).trim();
    if (!cleanStr || ['nama', 'username', 'no', 'pin'].includes(cleanStr.toLowerCase())) return;
    const cleanKey = normalizeKey(cleanStr);
    if (!cleanKey) return;

    const roleMeta = detectRoleBySuffix(cleanStr);
    const record = {
      name: cleanStr,
      school: roleMeta.defaultSchool,
      gender: "Perempuan",
      pin: roleMeta.defaultPin,
      role: roleMeta.role,
      roleLabel: roleMeta.roleLabel,
      hobby: "Membaca & Literasi",
      univ: "Universitas Sriwijaya",
      ig: `@${cleanKey.slice(0, 12)}`
    };

    customStudents[cleanKey] = record;
    if (!db.scores[cleanKey]) {
      db.scores[cleanKey] = {
        username: cleanKey, name: cleanStr, roleLabel: roleMeta.roleLabel, school: roleMeta.defaultSchool,
        casesDone: 0, gameScore: 0, utama: 0, tambahan: 0, pr: 0, duration: "00:00",
        resetCount: 0, resetNote: "Belum pernah reset (0/3)", comment: "-"
      };
    }
    addedCount++;
  });

  localStorage.setItem('SYANORA_EXCEL_STUDENTS', JSON.stringify(customStudents));
  saveMasterDatabase(db);
  const statusEl = document.getElementById('roster-status-text');
  if (statusEl) {
    statusEl.textContent = `Berhasil menambahkan ${addedCount} akun dari ${sourceLabel} (Siswa PIN: 101 | Guru/Validator PIN: 0808).`;
  }
  playSoundEffect('success');
}

function applyUserSession(userObj) {
  currentUser = userObj;
  authOverlay.hidden = true;
  startMozartClassicalMusic();

  const iconBadge = document.getElementById('role-icon-badge');
  if (iconBadge) iconBadge.innerHTML = getRoleBadgeIconSVG(userObj.role);

  const adminTab = document.getElementById('nav-researcher-tab');
  const isPrivileged = ['researcher', 'teacher', 'validator', 'admin'].includes(userObj.role);
  if (adminTab) adminTab.hidden = !isPrivileged;

  ensureUserScoreEntry(userObj.id);
  recordLog('Sesi Login', `Masuk sebagai ${userObj.roleLabel}`, 'Aktif');
  loadUserProfileUI();
  renderClassmatesDirectory();
  renderLeaderboard();
  renderAllAdminScreens();
  updateTopProfileHud();
}

const savedSession = localStorage.getItem('SYANORA_ACTIVE_USER');
if (savedSession) {
  try {
    applyUserSession(JSON.parse(savedSession));
  } catch (e) {
    authOverlay.hidden = false;
  }
}

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const rawInput = document.getElementById('auth-id-input').value.trim();
  const pinVal = document.getElementById('auth-pin-input').value.trim();
  const cleanKey = normalizeKey(rawInput);
  if (!cleanKey) return;

  const allUsers = getRegisteredUsers();
  let account = allUsers[rawInput.toLowerCase()] || allUsers[cleanKey];
  const roleMeta = detectRoleBySuffix(rawInput);

  const validPinForNew = (roleMeta.role === 'student' && pinVal === '101') ||
                         (['teacher', 'validator'].includes(roleMeta.role) && pinVal === '0808') ||
                         cleanKey === 'musyhapmiwa';

  if (!account && validPinForNew) {
    account = {
      name: rawInput, school: roleMeta.defaultSchool, gender: "Perempuan",
      pin: roleMeta.defaultPin, role: roleMeta.role, roleLabel: roleMeta.roleLabel,
      hobby: "Membaca & Literasi", univ: "Universitas Sriwijaya", ig: `@${cleanKey.slice(0, 12)}`
    };
    const customStudents = JSON.parse(localStorage.getItem('SYANORA_EXCEL_STUDENTS') || '{}');
    customStudents[cleanKey] = account;
    localStorage.setItem('SYANORA_EXCEL_STUDENTS', JSON.stringify(customStudents));
  }

  const isPinValid = account && (
    account.pin === '*' ||
    account.pin === pinVal ||
    (account.role === 'student' && pinVal === '101')
  );

  if (!isPinValid) {
    authError.hidden = false;
    playSoundEffect('shock');
    return;
  }

  authError.hidden = true;
  const savedProfile = JSON.parse(localStorage.getItem(`SYANORA_PROFILE_${cleanKey}`) || 'null');
  const userObj = savedProfile || {
    id: cleanKey, name: account.name, school: account.school, gender: account.gender,
    hobby: account.hobby, univ: account.univ, ig: account.ig,
    role: account.role || roleMeta.role, roleLabel: account.roleLabel || roleMeta.roleLabel, isComplete: false
  };
  userObj.role = account.role || roleMeta.role;
  userObj.roleLabel = account.roleLabel || roleMeta.roleLabel;

  localStorage.setItem('SYANORA_ACTIVE_USER', JSON.stringify(userObj));
  playSoundEffect('success');
  applyUserSession(userObj);
});

document.getElementById('upload-roster-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  if (file.name.endsWith('.csv')) {
    reader.onload = (ev) => {
      const names = [];
      ev.target.result.split(/\r?\n/).forEach(line => {
        line.split(/[,;]/).map(c => c.replace(/["']/g, '').trim()).forEach(col => {
          if (col && isNaN(Number(col)) && !['0808', '101'].includes(col)) names.push(col);
        });
      });
      registerStudentList(names, `CSV "${file.name}"`);
    };
    reader.readAsText(file);
  } else {
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        const names = [];
        rows.forEach(r => r.forEach(cell => {
          if (cell && typeof cell === 'string' && isNaN(Number(cell)) && !['0808', '101'].includes(cell.trim())) names.push(cell.trim());
        }));
        registerStudentList(names, `Excel "${file.name}"`);
      } catch (err) {
        alert('Pastikan format file adalah .xlsx, .xls, atau .csv.');
      }
    };
    reader.readAsArrayBuffer(file);
  }
});

document.getElementById('add-bulk-students-btn').addEventListener('click', () => {
  const inp = document.getElementById('manual-bulk-students');
  const raw = inp.value.trim();
  if (!raw) return;
  registerStudentList(raw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean), 'Input Cepat');
  inp.value = '';
});

document.getElementById('copy-class-invite-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(PUBLIC_PRODUCTION_URL);
  alert(`Link Kelas SYANORA (${PUBLIC_PRODUCTION_URL}) berhasil disalin!`);
  playSoundEffect('success');
});

['open-guide-btn', 'guide-top-btn'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => { guideModal.hidden = false; playSoundEffect('click'); });
});
['close-guide-btn', 'close-guide-btn-bottom'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => { guideModal.hidden = true; playSoundEffect('click'); });
});
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('SYANORA_ACTIVE_USER');
  location.reload();
});

// 5. NAVIGASI MULTI-PAGE & TIMER LATIHAN
let practiceSeconds = 0;
let practiceTimerInterval = null;
let isPracticeFinished = false;

function startPracticeTimer() {
  if (isPracticeFinished || practiceTimerInterval) return;
  practiceTimerInterval = setInterval(() => {
    practiceSeconds++;
    const m = String(Math.floor(practiceSeconds / 60)).padStart(2, '0');
    const s = String(practiceSeconds % 60).padStart(2, '0');
    document.getElementById('test-timer').textContent = `${m}:${s}`;
  }, 1000);
}

function stopPracticeTimer() {
  if (practiceTimerInterval) {
    clearInterval(practiceTimerInterval);
    practiceTimerInterval = null;
  }
}

const navTabBtns = document.querySelectorAll('.nav-tab-btn');
const pageSections = document.querySelectorAll('.page-section');

function switchPage(targetId) {
  activePageId = targetId;
  navTabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-target') === targetId));
  pageSections.forEach(p => p.classList.toggle('active', p.id === targetId));
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (targetId === 'page-practice') startPracticeTimer();
  else stopPracticeTimer();

  if (targetId === 'page-analytics') renderAllAdminScreens();
  updateTopProfileHud();
  playSoundEffect('click');
}

navTabBtns.forEach(btn => btn.addEventListener('click', () => switchPage(btn.getAttribute('data-target'))));
document.querySelectorAll('.nav-jump').forEach(btn => btn.addEventListener('click', () => switchPage(btn.getAttribute('data-target'))));
document.getElementById('brand-home-trigger').addEventListener('click', () => switchPage('page-home'));

// 6. BERANDA & WIDGET GLOBAL ZETA AI (GESER BEBAS & PINDAH SISI)
const zetaGlobalPopup = document.getElementById('zeta-global-popup');
const globalChatMessages = document.getElementById('global-chat-messages');
const zetaWidgetContainer = document.getElementById('zeta-widget-container');
const switchZetaSideBtn = document.getElementById('switch-zeta-side-btn');
const expandZetaSizeBtn = document.getElementById('expand-zeta-size-btn');
const zetaDragHandle = document.getElementById('zeta-drag-handle');

function openGlobalZetaWithContext(contextTitle, autoQuestion = '') {
  zetaGlobalPopup.hidden = false;
  const ctxEl = document.getElementById('zeta-context-label');
  if (ctxEl) ctxEl.textContent = contextTitle;
  if (autoQuestion) {
    appendGlobalZetaBubble(autoQuestion, true);
    setTimeout(() => {
      appendGlobalZetaBubble(generateSmartContextualReply(autoQuestion, true), false);
    }, 250);
  }
  playSoundEffect('click');
}

document.getElementById('reveal-pattern-btn').addEventListener('click', (e) => {
  e.target.textContent = '14';
  e.target.style.background = '#34d399';
  document.getElementById('pattern-explanation').innerHTML = '<strong>Tepat sekali! Nilai suku ke-5 adalah 14.</strong><br>Setiap suku bertambah secara konstan sebesar +3 (<i>b</i> = 3), sehingga 11 + 3 = 14.';
  const wrap = document.getElementById('home-zeta-trigger-wrap');
  if (wrap) wrap.hidden = false;
  playSoundEffect('success');
});

const homeAskBtn = document.getElementById('home-ask-zeta-btn');
if (homeAskBtn) {
  homeAskBtn.addEventListener('click', () => {
    openGlobalZetaWithContext('Simulasi Pola Beranda', 'Mengapa pada barisan 2, 5, 8, 11 suku berikutnya adalah 14?');
  });
}

document.getElementById('top-zeta-toggle-btn').addEventListener('click', () => {
  zetaGlobalPopup.hidden = !zetaGlobalPopup.hidden;
  playSoundEffect('click');
});
document.getElementById('toggle-zeta-global-btn').addEventListener('click', () => {
  zetaGlobalPopup.hidden = !zetaGlobalPopup.hidden;
  playSoundEffect('click');
});
document.getElementById('close-zeta-global-btn').addEventListener('click', () => {
  zetaGlobalPopup.hidden = true;
  playSoundEffect('click');
});
document.querySelectorAll('.open-zeta-contextual').forEach(btn => {
  btn.addEventListener('click', () => {
    openGlobalZetaWithContext(btn.getAttribute('data-zcontext') || 'Diskusi ZETA AI');
  });
});

if (switchZetaSideBtn && zetaWidgetContainer) {
  switchZetaSideBtn.addEventListener('click', () => {
    zetaWidgetContainer.style.top = '';
    zetaWidgetContainer.style.left = '';
    zetaWidgetContainer.style.right = '';
    zetaWidgetContainer.style.bottom = '';
    zetaWidgetContainer.classList.toggle('dock-left');
    playSoundEffect('click');
  });
}

if (expandZetaSizeBtn && zetaGlobalPopup) {
  expandZetaSizeBtn.addEventListener('click', () => {
    zetaGlobalPopup.classList.toggle('zeta-expanded');
    playSoundEffect('click');
  });
}

(function enableZetaDragging() {
  if (!zetaDragHandle || !zetaWidgetContainer) return;
  let isDragging = false, startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

  function onDragStart(e) {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    const rect = zetaWidgetContainer.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    startX = e.touches ? e.touches[0].clientX : e.clientX;
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    zetaWidgetContainer.style.transition = 'none';
  }
  function onDragMove(e) {
    if (!isDragging) return;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const newLeft = Math.max(8, Math.min(window.innerWidth - 120, initialLeft + (cx - startX)));
    const newTop = Math.max(75, Math.min(window.innerHeight - 80, initialTop + (cy - startY)));
    zetaWidgetContainer.style.left = `${newLeft}px`;
    zetaWidgetContainer.style.top = `${newTop}px`;
    zetaWidgetContainer.style.right = 'auto';
    zetaWidgetContainer.style.bottom = 'auto';
  }
  function onDragEnd() {
    isDragging = false;
    zetaWidgetContainer.style.transition = '';
  }

  zetaDragHandle.addEventListener('mousedown', onDragStart);
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);
  zetaDragHandle.addEventListener('touchstart', onDragStart, { passive: true });
  window.addEventListener('touchmove', onDragMove, { passive: true });
  window.addEventListener('touchend', onDragEnd);
})();

// 7. KALKULATOR BANTU NUMERASI
const calcBox = document.getElementById('calc-floating-box');
const calcDisplay = document.getElementById('calc-display');

document.getElementById('top-calc-toggle-btn').addEventListener('click', () => {
  calcBox.hidden = !calcBox.hidden;
  playSoundEffect('click');
});
document.getElementById('close-calc-btn').addEventListener('click', () => {
  calcBox.hidden = true;
});
document.querySelectorAll('.open-calc-contextual').forEach(btn => {
  btn.addEventListener('click', () => {
    calcBox.hidden = false;
    playSoundEffect('click');
  });
});

document.getElementById('unlock-calc-practice-btn').addEventListener('click', () => {
  const inpA = document.getElementById('step-a-input').value.trim();
  const inpB = document.getElementById('step-b-input').value.trim();
  const inpF = document.getElementById('step-formula-select').value;
  if (!inpA || !inpB || !inpF) {
    alert('Isi terlebih dahulu Nilai Awal (a), Selisih Tetap (b), dan Strategi Rumus pada langkah 1-3 untuk membuka Kalkulator Bantu!');
    playSoundEffect('shock');
    return;
  }
  calcBox.hidden = false;
  document.getElementById('calc-status-note').textContent = `Pemetaan rumus terisi (a=${inpA}, b=${inpB}). Silakan hitung hasil akhirnya!`;
  playSoundEffect('success');
});

document.querySelectorAll('.calc-keys button').forEach(btn => {
  btn.addEventListener('click', () => {
    const k = btn.getAttribute('data-ckey');
    if (k === 'C') {
      calcDisplay.value = '';
    } else if (k === '=') {
      try {
        const safeExpr = calcDisplay.value.replace(/[^0-9+\-*/().]/g, '');
        calcDisplay.value = safeExpr ? String(Function(`"use strict"; return (${safeExpr})`)()) : '';
      } catch (e) {
        calcDisplay.value = 'Error';
      }
    } else {
      calcDisplay.value += k;
    }
    playSoundEffect('click');
  });
});

// 8. LABORATORIUM GRAFIK DIPERBESAR
const limitSelect = document.getElementById('limit-select');
const sliderA = document.getElementById('slider-a');
const sliderB = document.getElementById('slider-b');
const sliderN = document.getElementById('slider-n');
const inputNumA = document.getElementById('input-num-a');
const inputNumB = document.getElementById('input-num-b');
const barsContainer = document.getElementById('bars-container');

function updateVisualizer() {
  const a = Number(sliderA.value);
  const b = Number(sliderB.value);
  const n = Number(sliderN.value);
  inputNumA.value = a;
  inputNumB.value = b;
  document.getElementById('val-n').textContent = n;

  const un = a + (n - 1) * b;
  const sn = (n / 2) * (a + un);
  document.getElementById('label-un-sim').innerHTML = `Suku Terakhir (<i>U</i><sub>${n}</sub>)`;
  document.getElementById('label-sn-sim').innerHTML = `Jumlah Total (<i>S</i><sub>${n}</sub>)`;
  document.getElementById('res-un').textContent = un.toLocaleString('id-ID');
  document.getElementById('res-sn').textContent = sn.toLocaleString('id-ID');

  const terms = [];
  for (let i = 1; i <= n; i++) terms.push(a + (i - 1) * b);
  const maxAbs = Math.max(...terms.map(t => Math.abs(t)), 10);

  barsContainer.innerHTML = '';
  terms.forEach((val, idx) => {
    const heightPx = Math.max(18, Math.round((Math.abs(val) / maxAbs) * 220));
    const isNeg = val < 0;
    barsContainer.innerHTML += `
      <div class="bar-wrapper">
        <span class="bar-value" style="color:${isNeg ? '#e11d48' : '#1e293b'}">${val.toLocaleString('id-ID')}</span>
        <div class="bar-pillar" style="height:${heightPx}px; background:${isNeg ? '#f43f5e' : '#4f46e5'};"></div>
        <span class="bar-label">U<sub>${idx + 1}</sub></span>
      </div>
    `;
  });
}

limitSelect.addEventListener('change', () => {
  const lim = Number(limitSelect.value);
  sliderA.min = -lim; sliderA.max = lim;
  sliderB.min = -lim; sliderB.max = lim;
  updateVisualizer();
});
[sliderA, sliderB, sliderN].forEach(s => s.addEventListener('input', updateVisualizer));
inputNumA.addEventListener('input', () => { sliderA.value = inputNumA.value; updateVisualizer(); });
inputNumB.addEventListener('input', () => { sliderB.value = inputNumB.value; updateVisualizer(); });
updateVisualizer();

// 9. STUDI KASUS NUMERASI (RIWAYAT JAWABAN SALAH + HINT 1, 2, 3)
const numeracyCases = [
  {
    badge: "KASUS 01 · LITERASI FINANSIAL",
    title: "Perencanaan Dana Pembelian Laptop",
    story: `<p>Raka berencana membeli sebuah laptop seharga <strong>Rp5.000.000</strong> (5.000 ribu rupiah). Ia menabung selama <strong>8 bulan</strong> dengan penambahan nominal tetap setiap bulannya: bulan ke-1 Rp300.000, bulan ke-2 Rp380.000, dan bulan ke-3 Rp460.000.</p>`,
    table: `<table class="case-table"><thead><tr><th>Bulan 1 (<i>a</i>)</th><th>Bulan 2 (<i>U</i><sub>2</sub>)</th><th>Bulan 3 (<i>U</i><sub>3</sub>)</th><th>Durasi</th><th>Harga Laptop</th></tr></thead><tbody><tr><td>300 ribu</td><td>380 ribu</td><td>460 ribu</td><td>8 Bulan</td><td>5.000 ribu</td></tr></tbody></table>`,
    q1: "1. Berapa uang yang ditabung Raka khusus pada bulan ke-8 (U₈)?", u1: "ribu rupiah", a1: 860,
    q2: "2. Berapa TOTAL seluruh tabungan Raka setelah 8 bulan penuh (S₈)?", u2: "ribu rupiah", a2: 4640,
    q3: "3. Berapa kekurangan dana yang masih harus ditambahkan Raka?", u3: "ribu rupiah", a3: 360,
    hints: [
      "Petunjuk Tahap 1: Tentukan terlebih dahulu nilai awal a = 300 dan selisih kenaikan tabungan per bulan b = 380 − 300 = 80.",
      "Petunjuk Tahap 2: Untuk Pertanyaan 1, gunakan U₈ = 300 + (7 × 80). Untuk Pertanyaan 2, gunakan S₈ = (8/2) × (300 + U₈).",
      "Petunjuk Tahap 3 (Langkah Akhir): Dari perhitungan diperoleh U₈ = 860 dan S₈ = 4 × (300 + 860) = 4.640. Maka kekurangan dananya adalah 5.000 − 4.640 = 360."
    ],
    expl: "Tabungan bulan ke-8 (U₈) adalah 860 ribu rupiah, total 8 bulan (S₈) = 4.640 ribu rupiah, sehingga Raka masih membutuhkan tambahan dana sebesar 360 ribu rupiah."
  },
  {
    badge: "KASUS 02 · ENERGI TERBARUKAN",
    title: "Penghematan Listrik Panel Surya Sekolah",
    story: `<p>SMA Nusantara memasang panel surya secara bertahap. Bulan pertama menghemat <strong>120 kWh</strong>, bulan kedua <strong>150 kWh</strong>, dan bulan ketiga <strong>180 kWh</strong>. Target sekolah adalah minimal <strong>2.500 kWh</strong> dalam <strong>10 bulan</strong>.</p>`,
    table: `<table class="case-table"><thead><tr><th>Bulan 1 (<i>a</i>)</th><th>Bulan 2 (<i>U</i><sub>2</sub>)</th><th>Bulan 3 (<i>U</i><sub>3</sub>)</th><th>Masa Evaluasi</th><th>Target Hemat</th></tr></thead><tbody><tr><td>120 kWh</td><td>150 kWh</td><td>180 kWh</td><td>10 Bulan</td><td>2.500 kWh</td></tr></tbody></table>`,
    q1: "1. Berapa besar penghematan listrik pada bulan ke-10 (U₁₀)?", u1: "kWh", a1: 390,
    q2: "2. Berapa TOTAL penghematan listrik selama 10 bulan (S₁₀)?", u2: "kWh", a2: 2550,
    q3: "3. Berapa kelebihan penghematan dibanding target sekolah?", u3: "kWh", a3: 50,
    hints: [
      "Petunjuk Tahap 1: Diketahui penghematan awal a = 120 kWh, selisih kenaikan b = 150 − 120 = 30 kWh, dan durasi n = 10 bulan.",
      "Petunjuk Tahap 2: Hitung U₁₀ = 120 + (9 × 30), kemudian hitung total S₁₀ = (10/2) × (120 + U₁₀).",
      "Petunjuk Tahap 3 (Langkah Akhir): Diperoleh U₁₀ = 390 dan S₁₀ = 5 × (120 + 390) = 2.550. Kelebihan dari target 2.500 adalah 2.550 − 2.500 = 50."
    ],
    expl: "Penghematan bulan ke-10 (U₁₀) = 390 kWh, total 10 bulan (S₁₀) = 2.550 kWh, melampaui target sekolah sebesar 50 kWh."
  },
  {
    badge: "KASUS 03 · LINGKUNGAN (POLA MENURUN)",
    title: "Program Pengurangan Sampah Plastik",
    story: `<p>Volume sampah plastik kantin diturunkan secara konsisten setiap minggu: minggu ke-1 tercatat <strong>95 kg</strong>, minggu ke-2 turun menjadi <strong>88 kg</strong>, dan minggu ke-3 menjadi <strong>81 kg</strong>.</p>`,
    table: `<table class="case-table"><thead><tr><th>Minggu 1 (<i>a</i>)</th><th>Minggu 2 (<i>U</i><sub>2</sub>)</th><th>Minggu 3 (<i>U</i><sub>3</sub>)</th><th>Penurunan Mingguan (<i>b</i>)</th></tr></thead><tbody><tr><td>95 kg</td><td>88 kg</td><td>81 kg</td><td>−7 kg / minggu</td></tr></tbody></table>`,
    q1: "1. Berapa berat sampah plastik pada minggu ke-10 (U₁₀)?", u1: "kg", a1: 32,
    q2: "2. Berapa berat sampah plastik pada minggu ke-12 (U₁₂)?", u2: "kg", a2: 18,
    q3: "3. Berapa total akumulasi sampah plastik selama 10 minggu pertama (S₁₀)?", u3: "kg", a3: 635,
    hints: [
      "Petunjuk Tahap 1: Karena berat sampah semakin menurun setiap minggu, gunakan selisih negatif yaitu b = 88 − 95 = −7.",
      "Petunjuk Tahap 2: Hitung U₁₀ = 95 + 9(−7) dan U₁₂ = 95 + 11(−7). Lalu gunakan S₁₀ = 5 × (95 + U₁₀).",
      "Petunjuk Tahap 3 (Langkah Akhir): U₁₀ = 95 − 63 = 32 kg; U₁₂ = 95 − 77 = 18 kg; dan total S₁₀ = 5 × (95 + 32) = 635 kg."
    ],
    expl: "Minggu ke-10 (U₁₀) = 32 kg, minggu ke-12 (U₁₂) = 18 kg, dan total 10 minggu pertama (S₁₀) = 635 kg."
  },
  {
    badge: "KASUS 04 · AGRIBISNIS PERKEBUNAN",
    title: "Peningkatan Panen Kebun Hidroponik Siswa",
    story: `<p>Panen hidroponik periode ke-1 menghasilkan <strong>40 ikat</strong>, periode ke-2 sebanyak <strong>55 ikat</strong>, dan periode ke-3 sebanyak <strong>70 ikat</strong>. Kontrak pesanan membutuhkan total <strong>600 ikat</strong> dalam <strong>6 periode</strong>.</p>`,
    table: `<table class="case-table"><thead><tr><th>Periode 1 (<i>a</i>)</th><th>Periode 2 (<i>U</i><sub>2</sub>)</th><th>Periode 3 (<i>U</i><sub>3</sub>)</th><th>Kontrak Pesanan</th></tr></thead><tbody><tr><td>40 ikat</td><td>55 ikat</td><td>70 ikat</td><td>600 ikat (6 Periode)</td></tr></tbody></table>`,
    q1: "1. Berapa hasil panen pada periode ke-6 (U₆)?", u1: "ikat", a1: 115,
    q2: "2. Berapa TOTAL hasil panen selama 6 periode (S₆)?", u2: "ikat", a2: 465,
    q3: "3. Berapa kekurangan ikat sayur untuk memenuhi kontrak?", u3: "ikat", a3: 135,
    hints: [
      "Petunjuk Tahap 1: Panen awal a = 40 ikat, selisih kenaikan b = 55 − 40 = 15 ikat, dan n = 6 periode.",
      "Petunjuk Tahap 2: Hitung U₆ = 40 + (5 × 15), lalu hitung total S₆ = 3 × (40 + U₆).",
      "Petunjuk Tahap 3 (Langkah Akhir): Diperoleh U₆ = 115 ikat dan S₆ = 3 × (40 + 115) = 465 ikat. Kekurangan kontrak = 600 − 465 = 135 ikat."
    ],
    expl: "Panen periode ke-6 (U₆) = 115 ikat, total 6 periode (S₆) = 465 ikat, sehingga masih kurang 135 ikat."
  },
  {
    badge: "KASUS 05 · ARSITEKTUR & KONSTRUKSI",
    title: "Penyusunan Tumpukan Pipa Proyek",
    story: `<p>Pipa saluran air ditumpuk sebanyak <strong>8 lapisan</strong>. Lapisan ke-1 memuat <strong>50 pipa</strong>, lapisan ke-2 memuat <strong>46 pipa</strong>, dan lapisan ke-3 memuat <strong>42 pipa</strong>.</p>`,
    table: `<table class="case-table"><thead><tr><th>Lapisan 1 (<i>a</i>)</th><th>Lapisan 2 (<i>U</i><sub>2</sub>)</th><th>Lapisan 3 (<i>U</i><sub>3</sub>)</th><th>Banyak Lapisan (<i>n</i>)</th></tr></thead><tbody><tr><td>50 pipa</td><td>46 pipa</td><td>42 pipa</td><td>8 Lapisan</td></tr></tbody></table>`,
    q1: "1. Berapa banyak pipa pada lapisan ke-8 (U₈)?", u1: "pipa", a1: 22,
    q2: "2. Berapa TOTAL seluruh pipa dalam 8 lapisan (S₈)?", u2: "pipa", a2: 288,
    q3: "3. Jika proyek membutuhkan 300 pipa, berapa pipa tambahan yang diperlukan?", u3: "pipa", a3: 12,
    hints: [
      "Petunjuk Tahap 1: Setiap naik satu lapisan, jumlah pipa berkurang 4 (b = −4) dari nilai awal a = 50.",
      "Petunjuk Tahap 2: Hitung U₈ = 50 + 7(−4), lalu hitung total S₈ = 4 × (50 + U₈).",
      "Petunjuk Tahap 3 (Langkah Akhir): U₈ = 50 − 28 = 22 pipa; S₈ = 4 × (50 + 22) = 288 pipa; tambahan pipa = 300 − 288 = 12 pipa."
    ],
    expl: "Lapisan ke-8 berisi 22 pipa, total 8 lapisan 288 pipa, dan membutuhkan tambahan 12 pipa."
  }
];

let activeCaseIdx = 0;
let unlockedCaseMax = 0;
let caseWrongCount = 0;
let caseWrongHistory = [];
const caseTabBtns = document.querySelectorAll('#case-tabs-container .case-tab');

function loadNumeracyCase(idx) {
  activeCaseIdx = idx;
  caseWrongCount = 0;
  caseWrongHistory = [];
  const c = numeracyCases[idx];
  document.getElementById('case-badge').textContent = c.badge;
  document.getElementById('case-title').textContent = c.title;
  document.getElementById('case-story').innerHTML = c.story;
  document.getElementById('case-table-box').innerHTML = c.table;
  document.getElementById('case-q1-label').textContent = c.q1;
  document.getElementById('case-q2-label').textContent = c.q2;
  document.getElementById('case-q3-label').textContent = c.q3;
  document.getElementById('case-unit-1').textContent = c.u1;
  document.getElementById('case-unit-2').textContent = c.u2;
  document.getElementById('case-unit-3').textContent = c.u3;
  document.getElementById('num-input-1').value = '';
  document.getElementById('num-input-2').value = '';
  document.getElementById('num-input-3').value = '';
  document.getElementById('numerasi-feedback').hidden = true;
  document.getElementById('numerasi-hint').hidden = true;
  document.getElementById('next-case-btn').hidden = (idx >= unlockedCaseMax);

  caseTabBtns.forEach((btn, bIdx) => {
    btn.classList.toggle('active', bIdx === idx);
    const isLocked = bIdx > unlockedCaseMax;
    btn.classList.toggle('locked', isLocked);
    const baseNames = ["Kasus 1: Finansial", "Kasus 2: Energi Surya", "Kasus 3: Lingkungan", "Kasus 4: Agribisnis", "Kasus 5: Konstruksi"];
    btn.textContent = isLocked ? `${baseNames[bIdx]} (Terkunci)` : baseNames[bIdx];
  });
}

function showProgressiveCaseHint(latestWrongText = '') {
  if (latestWrongText) caseWrongHistory.push(latestWrongText);
  const c = numeracyCases[activeCaseIdx];
  const hBox = document.getElementById('numerasi-hint');
  hBox.hidden = false;
  const maxStage = Math.min(caseWrongCount, c.hints.length - 1);
  const wrongBanner = caseWrongHistory.length > 0
    ? `<div class="wrong-history-pill">Catatan Jawabanmu yang Belum Tepat:<br>${caseWrongHistory.map((w, i) => `Percobaan ${i + 1}: <strong>${w}</strong>`).join(' &nbsp;|&nbsp; ')}</div>`
    : '';
  const stagesHTML = c.hints.slice(0, maxStage + 1).map(h => `<div style="margin-bottom:6px;">• ${h}</div>`).join('');
  hBox.innerHTML = `${wrongBanner}<strong>Bimbingan Bertahap ZETA (Tahap ${maxStage + 1} dari ${c.hints.length}):</strong><div style="margin-top:6px;">${stagesHTML}</div>`;
}

caseTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetIdx = Number(btn.getAttribute('data-case'));
    if (targetIdx > unlockedCaseMax) {
      playSoundEffect('shock');
      alert('Selesaikan kasus saat ini dengan benar terlebih dahulu!');
      return;
    }
    loadNumeracyCase(targetIdx);
    playSoundEffect('click');
  });
});

document.getElementById('hint-numerasi-btn').addEventListener('click', () => {
  showProgressiveCaseHint();
  if (caseWrongCount < 2) caseWrongCount++;
  playSoundEffect('click');
});

document.getElementById('check-numerasi-btn').addEventListener('click', () => {
  const c = numeracyCases[activeCaseIdx];
  const v1 = Number(document.getElementById('num-input-1').value.trim());
  const v2 = Number(document.getElementById('num-input-2').value.trim());
  const v3 = Number(document.getElementById('num-input-3').value.trim());
  const fb = document.getElementById('numerasi-feedback');
  fb.hidden = false;

  if (v1 === c.a1 && v2 === c.a2 && v3 === c.a3) {
    if (activeCaseIdx === unlockedCaseMax && unlockedCaseMax < numeracyCases.length - 1) unlockedCaseMax++;
    loadNumeracyCase(activeCaseIdx);
    fb.hidden = false;
    fb.className = 'feedback correct';
    fb.innerHTML = `<strong>Analisis Tepat!</strong><br>${c.expl}`;
    if (activeCaseIdx < numeracyCases.length - 1) document.getElementById('next-case-btn').hidden = false;
    updateStudentScoreRecord('casesDone', unlockedCaseMax + 1);
    playSoundEffect('success');
    recordLog(`Studi Kasus ${activeCaseIdx + 1}`, `${v1}, ${v2}, ${v3}`, 'Tuntas');
  } else {
    const wrongDetail = `Q1=${v1} (${v1 === c.a1 ? 'Benar' : 'Salah'}), Q2=${v2} (${v2 === c.a2 ? 'Benar' : 'Salah'}), Q3=${v3} (${v3 === c.a3 ? 'Benar' : 'Salah'})`;
    fb.className = 'feedback try-again';
    fb.innerHTML = `<strong>Jawaban (${wrongDetail}) belum tepat.</strong> Perhatikan catatan kesalahan dan Petunjuk Bertahap di atas!`;
    showProgressiveCaseHint(wrongDetail);
    caseWrongCount++;
    playSoundEffect('shock');
    recordLog(`Studi Kasus ${activeCaseIdx + 1}`, wrongDetail, `Salah (Hint ${Math.min(caseWrongCount, 3)})`);
  }
});

document.getElementById('next-case-btn').addEventListener('click', () => {
  if (activeCaseIdx < numeracyCases.length - 1) {
    loadNumeracyCase(activeCaseIdx + 1);
    playSoundEffect('click');
  }
});
loadNumeracyCase(0);

// 10. MINI-GAME POLA BILANGAN
const gameLevels = [
  { badge: "LEVEL 1 / 6", title: "Menentukan Suku ke-6 Barisan Naik", desc: "Tentukan nilai pada kotak tanda tanya (<i>U</i><sub>6</sub>)!", blocks: ["4", "7", "10", "13", "16", "?"], target: 19, hints: ["Petunjuk 1: Cari selisih antara 4 ke 7, 7 ke 10, dst.", "Petunjuk 2: Selisihnya adalah +3 pada setiap langkah.", "Petunjuk 3: Tambahkan suku ke-5 (16) dengan 3, yaitu 16 + 3 = 19."] },
  { badge: "LEVEL 2 / 6", title: "Tantangan Pola Menurun (Negatif)", desc: "Berapakah nilai suku ke-6 (<i>U</i><sub>6</sub>)?", blocks: ["20", "14", "8", "2", "−4", "?"], target: -10, hints: ["Petunjuk 1: Barisan ini semakin mengecil (dikurangi).", "Petunjuk 2: Setiap langkah dikurangi 6 (b = −6).", "Petunjuk 3: Kurangkan −4 dengan 6, yaitu −4 − 6 = −10."] },
  { badge: "LEVEL 3 / 6", title: "Menemukan Suku Tengah (Ut)", desc: "Berapakah nilai suku tengah (<i>U</i><sub>3</sub>) yang tepat?", blocks: ["12", "20", "?", "36", "44"], target: 28, hints: ["Petunjuk 1: Suku tengah adalah rata-rata suku awal dan akhir.", "Petunjuk 2: Jumlahkan 12 dan 44 lalu bagi 2.", "Petunjuk 3: (12 + 44) / 2 = 56 / 2 = 28."] },
  { badge: "LEVEL 4 / 6", title: "Menghitung Akumulasi Deret 5 Suku (S₅)", desc: "Jumlahkan seluruh nilai pada kelima kartu bilangan berikut (<i>S</i><sub>5</sub>)!", blocks: ["10", "+ 15", "+ 20", "+ 25", "+ 30", "= ?"], target: 100, hints: ["Petunjuk 1: Gunakan rumus jumlah deret S₅ = (5/2) × (a + U₅).", "Petunjuk 2: S₅ = (5/2) × (10 + 30).", "Petunjuk 3: (5/2) × 40 = 100."] },
  { badge: "LEVEL 5 / 6", title: "Menyisipkan Bilangan Baru", desc: "Di antara 6 dan 30 disisipkan 2 bilangan. Berapakah nilai suku ke-2?", blocks: ["6", "?", "22", "30"], target: 14, hints: ["Petunjuk 1: Cari beda baru dengan b' = (30 − 6) / (2 + 1).", "Petunjuk 2: Diperoleh beda baru b' = 24 / 3 = 8.", "Petunjuk 3: Tambahkan suku pertama (6) dengan 8, yaitu 6 + 8 = 14."] },
  { badge: "LEVEL 6 / 6", title: "Tantangan Master: Deret Suku ke-8 (S₈)", desc: "Suku pertama 5 dan suku ke-8 adalah 40. Berapakah jumlah 8 suku pertamanya (<i>S</i><sub>8</sub>)?", blocks: ["U₁ = 5", "...", "U₈ = 40", "S₈ = ?"], target: 180, hints: ["Petunjuk 1: Gunakan rumus S₈ = (8/2) × (U₁ + U₈).", "Petunjuk 2: S₈ = 4 × (5 + 40).", "Petunjuk 3: 4 × 45 = 180."] }
];

let curGameIdx = 0;
let gameScore = 0;
let gameStreak = 0;
let gameWrongCount = 0;
let gameWrongHistory = [];
const gameSlider = document.getElementById('game-slider');
const gameSliderVal = document.getElementById('game-slider-val');
const gameFeedback = document.getElementById('game-feedback');
const gameHintBox = document.getElementById('game-hint-box');
const gameNextBtn = document.getElementById('game-next-btn');
const gameVisualBlocks = document.getElementById('game-visual-blocks');

function loadGameLevel(idx) {
  curGameIdx = idx;
  gameWrongCount = 0;
  gameWrongHistory = [];
  const g = gameLevels[idx];
  document.getElementById('game-level-badge').textContent = g.badge;
  document.getElementById('game-title').textContent = g.title;
  document.getElementById('game-desc').innerHTML = g.desc;
  gameVisualBlocks.innerHTML = g.blocks.map(b => `<div class="g-block ${b.includes('?') ? 'target-block' : ''}">${b}</div>`).join('');
  gameFeedback.hidden = true;
  gameHintBox.hidden = true;
  gameNextBtn.hidden = true;
}

function showProgressiveGameHint(wrongVal = null) {
  if (wrongVal !== null) gameWrongHistory.push(wrongVal);
  const g = gameLevels[curGameIdx];
  gameHintBox.hidden = false;
  const stage = Math.min(gameWrongCount, g.hints.length - 1);
  const wrongBanner = gameWrongHistory.length > 0
    ? `<div class="wrong-history-pill">Jawabanmu yang Belum Tepat: ${gameWrongHistory.map((w, i) => `Percobaan ${i + 1}: <strong>${w}</strong>`).join(' | ')}</div>`
    : '';
  gameHintBox.innerHTML = `${wrongBanner}<strong>Petunjuk Bertahap (Tahap ${stage + 1}/${g.hints.length}):</strong><br>${g.hints.slice(0, stage + 1).join('<br>')}`;
}

gameSlider.addEventListener('input', () => { gameSliderVal.textContent = gameSlider.value; });

function checkGameAnswer(val) {
  const g = gameLevels[curGameIdx];
  gameFeedback.hidden = false;
  if (val === g.target) {
    gameStreak++;
    gameScore += 100 + (gameStreak * 10);
    document.getElementById('game-score-pill').textContent = `Total Skor: ${gameScore}`;
    document.getElementById('game-streak-badge').textContent = `Streak: ${gameStreak}`;
    gameFeedback.className = 'feedback correct';
    gameFeedback.innerHTML = `<strong>Luar biasa! Jawaban ${g.target} benar.</strong>`;
    gameNextBtn.hidden = false;
    updateStudentScoreRecord('gameScore', gameScore);
    playSoundEffect('success');
    recordLog(`Game ${g.badge}`, val, 'Tuntas');
  } else {
    gameStreak = 0;
    document.getElementById('game-streak-badge').textContent = `Streak: 0`;
    gameFeedback.className = 'feedback try-again';
    gameFeedback.innerHTML = `<strong>Jawaban ${val} masih salah!</strong> Perhatikan catatan kesalahan dan petunjuk bertahap di atas.`;
    showProgressiveGameHint(val);
    gameWrongCount++;
    playSoundEffect('shock');
  }
}

document.getElementById('game-submit-btn').addEventListener('click', () => checkGameAnswer(Number(gameSlider.value)));
document.getElementById('game-hint-btn').addEventListener('click', () => {
  showProgressiveGameHint();
  if (gameWrongCount < 2) gameWrongCount++;
  playSoundEffect('click');
});

document.getElementById('game-voice-btn').addEventListener('click', () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const statusMsg = document.getElementById('voice-status-msg');
  statusMsg.hidden = false;
  if (!SpeechRecognition) {
    statusMsg.textContent = 'Browser belum mendukung input suara langsung. Gunakan penggeser angka.';
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'id-ID';
  statusMsg.textContent = 'Mikrofon aktif... Ucapkan angka jawabanmu!';
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    const matchNum = transcript.match(/-?\d+/);
    if (matchNum) {
      const spokenVal = Number(matchNum[0]);
      gameSlider.value = spokenVal;
      gameSliderVal.textContent = spokenVal;
      statusMsg.textContent = `Suara terdeteksi: "${transcript}" (${spokenVal})`;
      checkGameAnswer(spokenVal);
    } else {
      statusMsg.textContent = `Terdengar: "${transcript}". Ucapkan angka dengan jelas.`;
    }
  };
  recognition.start();
});

gameNextBtn.addEventListener('click', () => {
  curGameIdx = (curGameIdx + 1) % gameLevels.length;
  loadGameLevel(curGameIdx);
  playSoundEffect('click');
});
loadGameLevel(0);

// 11. DISKUSI ANTAR SISWA
const discussionFeed = document.getElementById('discussion-feed');
const discussionForm = document.getElementById('discussion-form');
const discussionInput = document.getElementById('discussion-input');
const discFileInput = document.getElementById('disc-file-input');
const discAttachPreview = document.getElementById('disc-attach-preview');

function renderDiscussionFeedFromDB() {
  const db = getMasterDatabase();
  discussionFeed.innerHTML = '';
  db.discussions.forEach((d, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'discussion-item';
    itemDiv.innerHTML = `
      <div class="disc-header">
        <strong>${d.name}</strong>
        <span class="disc-time">Diposting pukul ${d.time}</span>
      </div>
      <p class="disc-text">${d.message}</p>
      ${d.mediaHTML || ''}
      <div style="text-align:right; margin-top:6px;">
        <button type="button" class="chip-btn edit-msg-btn">Edit Pesan</button>
      </div>
    `;
    itemDiv.querySelector('.edit-msg-btn').addEventListener('click', () => {
      const updated = prompt('Perbarui pesan diskusi:', d.message);
      if (updated !== null && updated.trim() !== '') {
        const editTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const freshDB = getMasterDatabase();
        freshDB.discussions[index].message = updated.trim();
        freshDB.discussions[index].time = `${d.time} (Diedit ${editTime})`;
        saveMasterDatabase(freshDB);
        renderDiscussionFeedFromDB();
      }
    });
    discussionFeed.appendChild(itemDiv);
  });
}
renderDiscussionFeedFromDB();

discFileInput.addEventListener('change', () => {
  discAttachPreview.hidden = !discFileInput.files[0];
  if (discFileInput.files[0]) discAttachPreview.textContent = `Lampiran siap dikirim: ${discFileInput.files[0].name}`;
});

discussionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const textVal = discussionInput.value.trim();
  const file = discFileInput.files[0];
  if (!textVal && !file) return;

  const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  let mediaHTML = '';
  let attachName = '-';
  if (file) {
    attachName = file.name;
    const fileUrl = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) mediaHTML = `<div style="margin-top:8px;"><img src="${fileUrl}" style="max-width:240px; border-radius:10px;"></div>`;
    else if (file.type.startsWith('audio/')) mediaHTML = `<div style="margin-top:8px;"><audio controls src="${fileUrl}"></audio></div>`;
    else mediaHTML = `<div style="margin-top:8px;"><a href="${fileUrl}" download="${file.name}" class="chip-btn">Unduh: ${file.name}</a></div>`;
  }

  const db = getMasterDatabase();
  db.discussions.push({
    time: nowStr,
    username: currentUser ? currentUser.id : 'siswa',
    name: currentUser ? currentUser.name : 'Siswa',
    message: textVal,
    attachment: attachName,
    mediaHTML: mediaHTML
  });
  saveMasterDatabase(db);
  renderDiscussionFeedFromDB();
  recordLog('Ruang Diskusi Kelas', textVal || attachName, 'Terkirim');

  discussionFeed.scrollTop = discussionFeed.scrollHeight;
  discussionInput.value = '';
  discFileInput.value = '';
  discAttachPreview.hidden = true;
  playSoundEffect('success');
});

// 12. LATIHAN 15 SOAL & ENGINE ZETA AI TERKALIBRASI PENUH
const QUESTION_BANK = {
  utama: [
    {
      step: "LATIHAN UTAMA · SOAL 1 / 5",
      indicator: "Formulate & Employ: Menentukan Suku ke-n",
      title: "Susunan Kursi Gedung Pertunjukan",
      problem: `<p>Baris pertama memuat <strong>12 kursi</strong>, baris kedua <strong>16 kursi</strong>, dan baris ketiga <strong>20 kursi</strong>. Berapakah banyak kursi pada <strong>baris ke-10</strong>?</p>`,
      unit: "kursi", expectedA: 12, expectedB: 4, expectedFormula: "Un", answer: 48, wrongTrap: 300,
      explaining: "Karena soal ini menanyakan banyak kursi pada <strong>baris ke-10 saja</strong> (bukan total seluruh kursi di gedung), kita menggunakan rumus suku ke-<i>n</i>: <strong><i>U<sub>n</sub></i> = <i>a</i> + (<i>n</i> − 1)<i>b</i></strong>.",
      guiding: [
        "Petunjuk Tahap 1: Identifikasi nilai awal pada baris pertama yaitu a = 12, dan selisih pertambahan kursi tiap baris yaitu b = 16 − 12 = 4.",
        "Petunjuk Tahap 2: Karena mencari baris ke-10 (n = 10), masukkan ke dalam rumus suku ke-10: U₁₀ = a + (10 − 1)b = 12 + (9 × 4).",
        "Petunjuk Tahap 3 (Langkah Hitung Akhir): Kalikan 9 × 4 = 36, lalu jumlahkan dengan kursi awal: 12 + 36 = 48 kursi."
      ],
      summary: "Interpretasi Numerasi: Dengan kursi baris pertama a = 12 dan penambahan tetap b = 4 kursi/baris, maka kapasitas khusus pada baris ke-10 adalah 48 kursi."
    },
    {
      step: "LATIHAN UTAMA · SOAL 2 / 5",
      indicator: "Formulate & Employ: Menganalisis Pola Menurun",
      title: "Evaluasi Waktu Tempuh Lari",
      problem: `<p>Minggu ke-1 membutuhkan waktu <strong>96 detik</strong>, minggu ke-2 <strong>90 detik</strong>, dan minggu ke-3 <strong>84 detik</strong>. Berapa detik catatan waktu pada <strong>minggu ke-8</strong>?</p>`,
      unit: "detik", expectedA: 96, expectedB: -6, expectedFormula: "Un", answer: 54, wrongTrap: 138,
      explaining: "Waktu tempuh lari semakin mengecil setiap minggu, artinya selisih tetapnya bernilai <strong>negatif (<i>b</i> &lt; 0)</strong>.",
      guiding: [
        "Petunjuk Tahap 1: Waktu awal minggu ke-1 adalah a = 96 detik. Karena menurun ke 90 detik, maka selisihnya negatif: b = 90 − 96 = −6.",
        "Petunjuk Tahap 2: Untuk mencari waktu pada minggu ke-8 (n = 8), gunakan U₈ = a + 7b = 96 + (7 × (−6)).",
        "Petunjuk Tahap 3 (Langkah Hitung Akhir): Hitung 7 × (−6) = −42, kemudian 96 − 42 = 54 detik."
      ],
      summary: "Interpretasi Numerasi: Penurunan waktu tempuh secara konsisten sebesar 6 detik/minggu membuat catatan waktu atlet pada minggu ke-8 menjadi lebih cepat, yakni 54 detik."
    },
    {
      step: "LATIHAN UTAMA · SOAL 3 / 5",
      indicator: "Employ: Menghitung Akumulasi Deret (Sn)",
      title: "Total Produksi Kerajinan Siswa",
      problem: `<p>Hari ke-1 selesai <strong>20 unit</strong>, hari ke-2 <strong>30 unit</strong>, dan hari ke-3 <strong>40 unit</strong>. Berapa <strong>jumlah total seluruh suvenir</strong> selama <strong>6 hari pertama</strong>?</p>`,
      unit: "unit", expectedA: 20, expectedB: 10, expectedFormula: "Sn", answer: 270, wrongTrap: 70,
      explaining: "Menanyakan <strong>jumlah total selama 6 hari</strong> berarti menjumlahkan seluruh produksi dari hari ke-1 sampai ke-6 menggunakan rumus Deret: <strong><i>S<sub>n</sub></i> = (<i>n</i>/2)(2<i>a</i> + (<i>n</i> − 1)<i>b</i>)</strong>.",
      guiding: [
        "Petunjuk Tahap 1: Produksi awal a = 20 unit, kenaikan harian b = 30 − 20 = 10 unit, dan lama waktu n = 6 hari.",
        "Petunjuk Tahap 2: Gunakan rumus jumlah deret S₆ = (6/2) × (2(20) + 5(10)).",
        "Petunjuk Tahap 3 (Langkah Hitung Akhir): S₆ = 3 × (40 + 50) = 3 × 90 = 270 unit."
      ],
      summary: "Interpretasi Numerasi: Akumulasi seluruh suvenir yang terkumpul selama 6 hari produksi berturut-turut mencapai 270 unit."
    },
    {
      step: "LATIHAN UTAMA · SOAL 4 / 5",
      indicator: "Formulate & Employ: Menentukan Suku Awal dari Dua Suku Jauh",
      title: "Kenaikan Tunjangan Berkala",
      problem: `<p>Pada tahun ke-3 tunjangan staf <strong>400 ribu rupiah</strong>, dan pada tahun ke-7 menjadi <strong>600 ribu rupiah</strong>. Berapakah tunjangan pada <strong>tahun pertama (<i>a</i>)</strong>?</p>`,
      unit: "ribu rupiah", expectedA: 300, expectedB: 50, expectedFormula: "Un", answer: 300, wrongTrap: 350,
      explaining: "Dari dua urutan tahun yang diketahui (tahun ke-3 dan ke-7), cari dulu kenaikan per tahunnya: <i>b</i> = (600 − 400) / (7 − 3).",
      guiding: [
        "Petunjuk Tahap 1: Hitung selisih kenaikan tahunan: b = (600 − 400) / (7 − 3) = 200 / 4 = 50 ribu.",
        "Petunjuk Tahap 2: Masukkan b = 50 ke persamaan tahun ke-3: U₃ = a + 2b = 400 -> a + 2(50) = 400.",
        "Petunjuk Tahap 3 (Langkah Hitung Akhir): a = 400 − 100 = 300 ribu rupiah."
      ],
      summary: "Interpretasi Numerasi: Dengan kenaikan rutin Rp50.000 per tahun, besaran tunjangan awal staf pada tahun pertama adalah Rp300.000 (300 ribu rupiah)."
    },
    {
      step: "LATIHAN UTAMA · SOAL 5 / 5",
      indicator: "Interpret: Evaluasi Kecukupan Target Finansial",
      title: "Evaluasi Target Dana Kegiatan Amal",
      problem: `<p>OSIS mengumpulkan donasi <strong>5 hari</strong>: hari pertama <strong>100 ribu</strong>, hari kedua <strong>150 ribu</strong>, dst. Jika targetnya <strong>1.200 ribu rupiah</strong>, berapa <strong>kekurangan dana</strong> setelah hari ke-5?</p>`,
      unit: "ribu rupiah", expectedA: 100, expectedB: 50, expectedFormula: "Evaluasi", answer: 200, wrongTrap: 1000,
      explaining: "Hitung terlebih dahulu total donasi selama 5 hari (<i>S</i><sub>5</sub>), kemudian kurangkan target 1.200 ribu dengan total tersebut.",
      guiding: [
        "Petunjuk Tahap 1: Donasi hari pertama a = 100 ribu, kenaikan harian b = 50 ribu, dan durasi n = 5 hari.",
        "Petunjuk Tahap 2: Hitung total donasi 5 hari: S₅ = (5/2) × (2(100) + 4(50)) = (5/2) × 400 = 1.000 ribu.",
        "Petunjuk Tahap 3 (Langkah Hitung Akhir): Bandingkan dengan target 1.200 ribu: kekurangan dana = 1.200 − 1.000 = 200 ribu rupiah."
      ],
      summary: "Interpretasi Numerasi: Total donasi 5 hari mencapai Rp1.000.000, sehingga untuk memenuhi target Rp1.200.000 masih diperlukan tambahan dana sebesar Rp200.000 (200 ribu rupiah)."
    }
  ],
  tambahan: [
    { step: "LATIHAN TAMBAHAN · SOAL 1 / 5", indicator: "Aplikasi Barisan pada Transportasi", title: "Tarif Argo Taksi Kota", problem: `<p>Kilometer ke-1 sebesar <strong>15 ribu</strong>, km ke-2 <strong>19 ribu</strong>, km ke-3 <strong>23 ribu</strong>. Berapa tarif pada <strong>kilometer ke-12</strong>?</p>`, unit: "ribu rupiah", expectedA: 15, expectedB: 4, expectedFormula: "Un", answer: 59, wrongTrap: 444, explaining: "Gunakan rumus suku ke-12: U₁₂ = a + 11b.", guiding: ["Petunjuk Tahap 1: Tarif awal a = 15 ribu dan kenaikan per km b = 19 − 15 = 4 ribu.", "Petunjuk Tahap 2: Masukkan ke rumus U₁₂ = 15 + (11 × 4).", "Petunjuk Tahap 3: 15 + 44 = 59 ribu rupiah."], summary: "Interpretasi Numerasi: Biaya perjalanan khusus pada kilometer ke-12 mencapai 59 ribu rupiah." },
    { step: "LATIHAN TAMBAHAN · SOAL 2 / 5", indicator: "Akumulasi Jarak Tempuh", title: "Program Latihan Bersepeda", problem: `<p>Hari pertama menempuh <strong>8 km</strong>, hari kedua <strong>11 km</strong>, hari ketiga <strong>14 km</strong>. Berapa <strong>total jarak</strong> selama <strong>7 hari</strong>?</p>`, unit: "km", expectedA: 8, expectedB: 3, expectedFormula: "Sn", answer: 119, wrongTrap: 26, explaining: "Gunakan rumus jumlah deret 7 hari: S₇ = (7/2)(2a + 6b).", guiding: ["Petunjuk Tahap 1: Jarak awal a = 8 km, pertambahan b = 3 km, dan n = 7 hari.", "Petunjuk Tahap 2: S₇ = (7/2) × (2(8) + 6(3)) = (7/2) × (16 + 18).", "Petunjuk Tahap 3: (7/2) × 34 = 7 × 17 = 119 km."], summary: "Interpretasi Numerasi: Akumulasi jarak bersepeda selama sepekan penuh adalah 119 km." },
    { step: "LATIHAN TAMBAHAN · SOAL 3 / 5", indicator: "Aplikasi Suku Tengah", title: "Barisan Tiang Bendera", problem: `<p>Terdapat <strong>9 tiang</strong>: tiang ke-1 tingginya <strong>120 cm</strong> dan tiang ke-9 tingginya <strong>240 cm</strong>. Berapa tinggi <strong>tiang tengah (ke-5)</strong>?</p>`, unit: "cm", expectedA: 120, expectedB: 15, expectedFormula: "Un", answer: 180, wrongTrap: 160, explaining: "Tinggi tiang tengah adalah rata-rata tiang pertama dan terakhir: Ut = (a + Un) / 2.", guiding: ["Petunjuk Tahap 1: Suku awal a = 120 cm dan suku akhir U₉ = 240 cm.", "Petunjuk Tahap 2: Gunakan Ut = (120 + 240) / 2.", "Petunjuk Tahap 3: 360 / 2 = 180 cm."], summary: "Interpretasi Numerasi: Tiang bendera yang berada tepat di posisi tengah memiliki tinggi 180 cm." },
    { step: "LATIHAN TAMBAHAN · SOAL 4 / 5", indicator: "Analisis Penurunan Suhu Negatif", title: "Pendinginan Bahan Laboratorium", problem: `<p>Suhu menit ke-1 adalah <strong>25°C</strong>, turun <strong>4°C</strong> tiap menit (menit ke-2 = 21°C, dst). Berapa suhu pada <strong>menit ke-9</strong>?</p>`, unit: "°C", expectedA: 25, expectedB: -4, expectedFormula: "Un", answer: -7, wrongTrap: 57, explaining: "Karena suhu turun 4°C per menit, gunakan b = −4°C pada rumus U₉ = a + 8b.", guiding: ["Petunjuk Tahap 1: Suhu awal a = 25°C dan penurunan b = −4°C.", "Petunjuk Tahap 2: U₉ = 25°C + (8 × (−4°C)).", "Petunjuk Tahap 3: 25°C − 32°C = −7°C."], summary: "Interpretasi Numerasi: Pada menit ke-9, suhu sampel telah berada di bawah titik beku yaitu −7°C." },
    { step: "LATIHAN TAMBAHAN · SOAL 5 / 5", indicator: "Evaluasi Sisa Persediaan", title: "Target Bazar Buku Literasi", problem: `<p>Hari ke-1 terjual <strong>30 buku</strong>, hari ke-2 <strong>40 buku</strong>, naik 10 buku/hari selama <strong>6 hari</strong>. Dari stok <strong>400 buku</strong>, berapa buku yang <strong>tersisa</strong>?</p>`, unit: "buku", expectedA: 30, expectedB: 10, expectedFormula: "Evaluasi", answer: 70, wrongTrap: 330, explaining: "Hitung total buku terjual selama 6 hari (S₆), lalu kurangkan dari stok 400 buku.", guiding: ["Petunjuk Tahap 1: a = 30, b = 10, n = 6 hari.", "Petunjuk Tahap 2: Total terjual S₆ = 3 × (60 + 50) = 330 buku.", "Petunjuk Tahap 3: Sisa buku = 400 − 330 = 70 buku."], summary: "Interpretasi Numerasi: Dari 400 buku yang disediakan, terjual 330 buku sehingga tersisa 70 buku." }
  ],
  pr: [
    { step: "TUGAS / PR RUMAH · SOAL 1 / 5", indicator: "Skema Angsuran Menurun", title: "Angsuran Sepeda Listrik", problem: `<p>Bulan ke-1 membayar <strong>800 ribu</strong>, bulan ke-2 <strong>750 ribu</strong>, berkurang 50 ribu/bulan selama <strong>10 bulan</strong>. Berapa angsuran pada <strong>bulan ke-10</strong>?</p>`, unit: "ribu rupiah", expectedA: 800, expectedB: -50, expectedFormula: "Un", answer: 350, wrongTrap: 1250, explaining: "Gunakan b = −50 pada rumus U₁₀ = a + 9b.", guiding: ["Petunjuk Tahap 1: Angsuran awal a = 800 dan perubahan b = −50.", "Petunjuk Tahap 2: U₁₀ = 800 + (9 × (−50)).", "Petunjuk Tahap 3: 800 − 450 = 350 ribu rupiah."], summary: "Interpretasi Numerasi: Besaran angsuran pada bulan terakhir (ke-10) turun menjadi 350 ribu rupiah." },
    { step: "TUGAS / PR RUMAH · SOAL 2 / 5", indicator: "Akumulasi Total Angsuran", title: "Total Pelunasan Sepeda Listrik", problem: `<p>Dari data soal nomor 1 (a = 800 ribu, U₁₀ = 350 ribu, n = 10 bulan), berapakah <strong>harga total sepeda listrik</strong> seluruhnya (<i>S</i><sub>10</sub>)?</p>`, unit: "ribu rupiah", expectedA: 800, expectedB: -50, expectedFormula: "Sn", answer: 5750, wrongTrap: 350, explaining: "Jumlahkan seluruh angsuran 10 bulan menggunakan S₁₀ = (10/2) × (a + U₁₀).", guiding: ["Petunjuk Tahap 1: Diketahui a = 800, U₁₀ = 350, dan n = 10.", "Petunjuk Tahap 2: S₁₀ = 5 × (800 + 350).", "Petunjuk Tahap 3: 5 × 1.150 = 5.750 ribu rupiah."], summary: "Interpretasi Numerasi: Total keseluruhan dana yang dibayarkan untuk melunasi sepeda listrik adalah Rp5.750.000." },
    { step: "TUGAS / PR RUMAH · SOAL 3 / 5", indicator: "Penerapan Konsep Sisipan", title: "Penambahan Tiang Lampu Jalan", problem: `<p>Dua tiang berjarak <strong>48 meter</strong> disisipi <strong>5 tiang baru</strong>. Berapa meter <strong>jarak antar-tiang sekarang (<i>b'</i>)</strong>?</p>`, unit: "meter", expectedA: 0, expectedB: 8, expectedFormula: "Un", answer: 8, wrongTrap: 9, explaining: "Gunakan rumus sisipan: b' = b / (k + 1).", guiding: ["Petunjuk Tahap 1: Jarak semula b = 48 meter dan banyak sisipan k = 5.", "Petunjuk Tahap 2: b' = 48 / (5 + 1).", "Petunjuk Tahap 3: 48 / 6 = 8 meter."], summary: "Interpretasi Numerasi: Setelah disisipkan 5 tiang baru, jarak antar-tiang lampu kini menjadi rapat dan seragam setiap 8 meter." },
    { step: "TUGAS / PR RUMAH · SOAL 4 / 5", indicator: "Hubungan Un dan Sn", title: "Pertumbuhan Anggota Klub Sains", problem: `<p>Diketahui <i>S</i><sub>4</sub> = <strong>85 orang</strong> dan <i>S</i><sub>5</sub> = <strong>115 orang</strong>. Berapa anggota yang bergabung <strong>khusus pada bulan ke-5 (<i>U</i><sub>5</sub>)</strong>?</p>`, unit: "orang", expectedA: 10, expectedB: 5, expectedFormula: "Un", answer: 30, wrongTrap: 200, explaining: "Gunakan hubungan U₅ = S₅ − S₄.", guiding: ["Petunjuk Tahap 1: Total hingga bulan ke-5 adalah 115 dan hingga bulan ke-4 adalah 85.", "Petunjuk Tahap 2: Kurangkan 115 dengan 85.", "Petunjuk Tahap 3: 115 − 85 = 30 orang."], summary: "Interpretasi Numerasi: Penambahan anggota baru khusus pada bulan ke-5 adalah sebanyak 30 orang." },
    { step: "TUGAS / PR RUMAH · SOAL 5 / 5", indicator: "Keputusan Perbandingan Skema", title: "Perbandingan Skema Bonus", problem: `<p>Toko A memberi total bonus 5 hari sebesar <strong>600 ribu</strong>. Toko B memberi bonus hari pertama <strong>60 ribu</strong>, naik <strong>30 ribu/hari</strong> selama 5 hari. Berapa <strong>selisih total bonus</strong> kedua toko?</p>`, unit: "ribu rupiah", expectedA: 60, expectedB: 30, expectedFormula: "Evaluasi", answer: 0, wrongTrap: 600, explaining: "Hitung S₅ Toko B lalu kurangkan dengan total bonus Toko A.", guiding: ["Petunjuk Tahap 1: Di Toko B, a = 60, b = 30, n = 5.", "Petunjuk Tahap 2: Total Toko B = (5/2) × (120 + 120) = 600 ribu.", "Petunjuk Tahap 3: Selisih Toko B dan Toko A = 600 − 600 = 0 ribu."], summary: "Interpretasi Numerasi: Kedua skema menghasilkan total bonus 5 hari yang sama persis (Rp600.000), sehingga selisihnya adalah 0." }
  ]
};

let currentCategory = 'utama';
let curPracticeIdx = 0;
let practiceWrongCount = 0;
let practiceWrongHistory = [];
let lastStudentAttempt = null;
const chatMessages = document.getElementById('chat-messages');

function appendZetaMessage(roleType, contentHTML, isUser = false) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`;
  if (isUser) {
    div.textContent = contentHTML;
  } else {
    let badgeHTML = '';
    if (roleType === 'explain') badgeHTML = `<span class="role-tag role-explain">Penjelasan Konsep</span><br>`;
    else if (roleType === 'guide') badgeHTML = `<span class="role-tag role-guide">Petunjuk Bertahap</span><br>`;
    else if (roleType === 'feedback') badgeHTML = `<span class="role-tag role-feedback">Evaluasi Jawaban</span><br>`;
    div.innerHTML = `${badgeHTML}${contentHTML}`;
  }
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function loadPracticeQuestion(idx) {
  curPracticeIdx = idx;
  practiceWrongCount = 0;
  practiceWrongHistory = [];
  lastStudentAttempt = null;
  const q = QUESTION_BANK[currentCategory][idx];
  document.getElementById('practice-step-badge').textContent = q.step;
  document.getElementById('practice-indicator-badge').textContent = q.indicator;
  document.getElementById('challenge-title').textContent = q.title;
  document.getElementById('challenge-problem').innerHTML = q.problem;
  document.getElementById('challenge-unit').textContent = q.unit;
  document.getElementById('step-a-input').value = '';
  document.getElementById('step-b-input').value = '';
  document.getElementById('step-formula-select').value = '';
  document.getElementById('student-scratchpad').value = '';
  document.getElementById('answer-input').value = '';
  document.getElementById('feedback-box').hidden = true;
  document.getElementById('practice-progressive-hint').hidden = true;
  document.getElementById('next-btn').hidden = true;
  chatMessages.innerHTML = '';
  appendZetaMessage('explain', `Halo! Kita sedang membahas <strong>${q.title}</strong>. Jika kamu mengalami kesulitan atau menjawab kurang tepat, aku akan memberikan <strong>Petunjuk Bertahap (Tahap 1, 2, hingga 3)</strong> beserta catatan koreksi jawabanmu!`);
}

function showProgressivePracticeHint(wrongAttemptVal = null) {
  aiHelpCounter++;
  const q = QUESTION_BANK[currentCategory][curPracticeIdx];
  if (wrongAttemptVal !== null) {
    const inpA = document.getElementById('step-a-input').value.trim();
    const inpB = document.getElementById('step-b-input').value.trim();
    const stepInfo = (inpA || inpB) ? ` (a=${inpA || '?'}, b=${inpB || '?'})` : '';
    practiceWrongHistory.push(`${wrongAttemptVal} ${q.unit}${stepInfo}`);
  }

  const hBox = document.getElementById('practice-progressive-hint');
  hBox.hidden = false;
  const stageIdx = Math.min(practiceWrongCount, q.guiding.length - 1);
  const currentHint = q.guiding[stageIdx];
  const wrongBanner = practiceWrongHistory.length > 0
    ? `<div class="wrong-history-pill">Riwayat Jawabanmu yang Belum Tepat:<br>${practiceWrongHistory.map((w, i) => `• Percobaan ke-${i + 1}: menjawab <strong>${w}</strong>`).join('<br>')}</div>`
    : '';
  const accumulatedHints = q.guiding.slice(0, stageIdx + 1).map(h => `<div style="margin-bottom:5px;">• ${h}</div>`).join('');

  hBox.innerHTML = `${wrongBanner}<strong>Petunjuk Bertahap (Tahap ${stageIdx + 1} dari ${q.guiding.length}):</strong><div style="margin-top:6px;">${accumulatedHints}</div>`;
  appendZetaMessage('guide', `${wrongBanner}<strong>${currentHint}</strong>`);
  recordLog(`ZETA [Hint Tahap ${stageIdx + 1}] - ${q.title}`, currentHint, 'Dibimbing AI');
}

document.querySelectorAll('#practice-category-tabs .case-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#practice-category-tabs .case-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.getAttribute('data-pcat');
    document.getElementById('practice-workspace').hidden = false;
    document.getElementById('final-report-card').hidden = true;
    isPracticeFinished = false;
    loadPracticeQuestion(0);
    playSoundEffect('click');
  });
});

function triggerZetaExplaining() {
  aiHelpCounter++;
  const q = QUESTION_BANK[currentCategory][curPracticeIdx];
  appendZetaMessage('explain', q.explaining);
  recordLog(`ZETA [Penjelasan] - ${q.title}`, 'Meminta penjelasan konsep', 'Dibimbing AI');
  playSoundEffect('click');
}

function triggerZetaGuiding() {
  showProgressivePracticeHint();
  if (practiceWrongCount < 2) practiceWrongCount++;
  playSoundEffect('click');
}

function buildDiagnosticFeedback(userVal) {
  const q = QUESTION_BANK[currentCategory][curPracticeIdx];
  const inpA = document.getElementById('step-a-input').value.trim();
  const inpB = document.getElementById('step-b-input').value.trim();
  const inpForm = document.getElementById('step-formula-select').value;
  const notes = [];

  if (inpA !== '' && Number(inpA) !== q.expectedA) {
    notes.push(`• Pada kotak <strong>Nilai Awal (<i>a</i>)</strong> kamu mengisi <strong>${inpA}</strong>, seharusnya <strong>${q.expectedA}</strong>.`);
  }
  if (inpB !== '' && Number(inpB) !== q.expectedB) {
    notes.push(`• Pada kotak <strong>Selisih Tetap (<i>b</i>)</strong> kamu mengisi <strong>${inpB}</strong>, seharusnya <strong>${q.expectedB}</strong>.`);
  }
  if (inpForm !== '' && inpForm !== q.expectedFormula) {
    const labelMap = { Un: 'Suku ke-n (Uₙ)', Sn: 'Jumlah Deret (Sₙ)', Evaluasi: 'Deret & Selisih Target' };
    notes.push(`• Strategi rumus yang kamu pilih belum sesuai. Gunakan <strong>${labelMap[q.expectedFormula]}</strong>.`);
  }
  if (userVal === q.wrongTrap) {
    notes.push(`• Jawaban <strong>${userVal}</strong> menunjukkan kamu tertukar antara menghitung nilai urutan tertentu (<i>U<sub>n</sub></i>) dan jumlah total (<i>S<sub>n</sub></i>), atau belum menghitung selisih akhirnya.`);
  }
  if (notes.length === 0) {
    notes.push(`• Jawaban akhir <strong>${userVal !== null ? userVal : 'kosong'}</strong> belum tepat.`);
  }
  return `Evaluasi ZETA pada <strong>${q.title}</strong>:<br>${notes.join('<br>')}`;
}

function triggerZetaFeedback() {
  aiHelpCounter++;
  const valStr = document.getElementById('answer-input').value.trim();
  const numVal = valStr !== '' ? Number(valStr) : lastStudentAttempt;
  const q = QUESTION_BANK[currentCategory][curPracticeIdx];
  if (numVal === q.answer) appendZetaMessage('feedback', `Jawabanmu (<strong>${numVal} ${q.unit}</strong>) sudah tepat! ${q.summary}`);
  else appendZetaMessage('feedback', buildDiagnosticFeedback(numVal));
  playSoundEffect('click');
}

// ENGINE UTAMA ZETA AI TERKALIBRASI (SINKRON 100% DENGAN PERTANYAAN SISWA)
function generateSmartContextualReply(userText, isGlobal = false) {
  const clean = userText.toLowerCase().trim();
  const q = QUESTION_BANK[currentCategory][curPracticeIdx];
  const c = numeracyCases[activeCaseIdx];
  const g = gameLevels[curGameIdx];

  // 1. PRIORITAS UTAMA: Pola Menurun / Negatif / Penyusutan (Tombol "Proses Hitung Negatif")
  if (clean.includes('menurun') || clean.includes('negatif') || clean.includes('penyusutan') || clean.includes('berkurang') || clean.includes('mengecil') || clean.includes('turun') || clean.includes('-6') || clean.includes('−6') || clean.includes('18')) {
    lastUserMathQuestion = "proses menghitung barisan dengan pola menurun atau beda negatif";
    return `<strong>Proses Menghitung Pola Barisan Menurun (Beda Negatif <i>b</i> &lt; 0):</strong><br>
    Jika nilai barisan semakin mengecil dari suku sebelumnya, maka selisih tetapnya (<i>b</i>) bernilai <strong>negatif (−)</strong>:<br>
    1) <strong>Tentukan Suku Awal (<i>a</i>):</strong> Ambil nilai mula-mula (contoh suhu awal pendingin <strong><i>a</i> = 18°C</strong>).<br>
    2) <strong>Hitung Beda Negatif (<i>b</i>):</strong> Kurangkan suku kedua dengan suku pertama (<i>b</i> = <i>U</i><sub>2</sub> − <i>U</i><sub>1</sub>). Karena turun 4°C setiap jam, maka <strong><i>b</i> = −4°C</strong>.<br>
    3) <strong>Masukkan ke Rumus <i>U<sub>n</sub></i>:</strong> Ingat bahwa positif dikali negatif hasilnya negatif!<br>
       Contoh mencari jam ke-7 (<i>n</i> = 7):<br>
       <i>U</i><sub>7</sub> = 18°C + (7 − 1) × (−4°C)<br>
       <i>U</i><sub>7</sub> = 18°C + (6 × (−4°C)) = 18°C − 24°C = <strong>−6°C</strong>.`;
  }

  // 2. PRIORITAS KEDUA: Kenapa b-nya 3 / Cara Mencari a dan b
  if (clean.includes('kenapa b') || clean.includes('b nya') || clean.includes('b-nya') || /\bb\b/.test(clean) || clean.includes('beda') || clean.includes('selisih')) {
    lastUserMathQuestion = "cara menentukan nilai awal (a) dan selisih tetap (b)";
    return `<strong>Mengapa Nilai Beda (<i>b</i>) = 3 & Cara Mencari <i>a</i> serta <i>b</i>:</strong><br>
    • <strong>Cara Mencari Nilai Awal (<i>a</i>):</strong> Lihat angka paling pertama pada barisan. Pada barisan <strong>2, 5, 8, 11</strong>, angka pertamanya adalah <strong><i>a</i> = 2</strong>.<br>
    • <strong>Mengapa <i>b</i> = 3?</strong> Huruf <strong><i>b</i></strong> adalah selisih tetap antarsuku berurutan (rumusnya: <strong><i>b</i> = <i>U</i><sub>2</sub> − <i>U</i><sub>1</sub></strong>).<br>
      Jika kita kurangkan suku ke-2 dengan suku ke-1: <strong>5 − 2 = 3</strong> (begitu juga 8 − 5 = 3 dan 11 − 8 = 3). Karena selalu bertambah 3 secara tetap, maka <strong><i>b</i> = 3</strong>, sehingga suku ke-5 adalah 11 + 3 = <strong>14</strong>!`;
  }

  // 3. PRIORITAS KETIGA: Definisi & Rumus Lengkap (Un, Sn, Ut, b')
  if (clean.includes('definisi') || clean.includes('rumus') || clean.includes('maksud sn') || clean.includes('bedanya') || clean.includes('tengah') || clean.includes('sisipan')) {
    lastUserMathQuestion = "definisi dan rumus Barisan (Un) serta Deret Aritmetika (Sn)";
    return `<strong>Definisi & Rumus Lengkap Barisan serta Deret Aritmetika:</strong><br>
    1) <strong>Barisan Aritmetika (<i>U<sub>n</sub></i>):</strong> Susunan bilangan dengan selisih tetap (<i>b</i>) antarsuku. Digunakan jika soal menanyakan nilai pada <u>satu urutan tertentu saja</u>:<br>
       <strong><i>U<sub>n</sub></i> = <i>a</i> + (<i>n</i> − 1)<i>b</i></strong><br>
    2) <strong>Deret Aritmetika (<i>S<sub>n</sub></i>):</strong> Jumlah total akumulasi dari suku pertama sampai suku ke-<i>n</i> (<i>U</i><sub>1</sub> + <i>U</i><sub>2</sub> + ... + <i>U<sub>n</sub></i>). Digunakan jika soal menanyakan <u>total keseluruhan</u>:<br>
       <strong><i>S<sub>n</sub></i> = (<i>n</i> / 2) × (2<i>a</i> + (<i>n</i> − 1)<i>b</i>)</strong> atau <strong><i>S<sub>n</sub></i> = (<i>n</i> / 2) × (<i>a</i> + <i>U<sub>n</sub></i>)</strong><br>
    3) <strong>Suku Tengah (<i>U<sub>t</sub></i>):</strong> <strong><i>U<sub>t</sub></i> = (<i>a</i> + <i>U<sub>n</sub></i>) / 2</strong> (untuk <i>n</i> ganjil).<br>
    4) <strong>Sisipan (<i>b'</i>):</strong> <strong><i>b'</i> = <i>b</i> / (<i>k</i> + 1)</strong> (jika disisipkan <i>k</i> bilangan baru).`;
  }

  // 4. PRIORITAS KEEMPAT: Proses Menilai / Skor / Rapor
  if (clean.includes('menilai') || clean.includes('penilaian') || clean.includes('skor') || clean.includes('poin') || clean.includes('rapor') || clean.includes('nilai')) {
    lastUserMathQuestion = "proses penilaian skor dan ketuntasan belajar";
    return `<strong>Proses Menilai Skor & Ketuntasan Belajar di SYANORA:</strong><br>
    1) <strong>Skor Paket Latihan (0–100):</strong> Setiap paket latihan terdiri atas 5 soal kontekstual (masing-masing bernilai 20 poin).<br>
    2) <strong>Evaluasi 3 Proses Numerasi (Formulate, Employ, Interpret):</strong> Sistem memeriksa ketepatanmu dalam merumuskan nilai awal (<i>a</i>), mengenali selisih (<i>b</i>), memilih strategi rumus (<i>U<sub>n</sub></i> atau <i>S<sub>n</sub></i>), dan menafsirkan hasil akhir.<br>
    3) <strong>Bantuan Adaptif:</strong> Jika jawabanmu belum tepat, kamu mendapatkan <em>Petunjuk Bertahap 1, 2, hingga 3</em> untuk memperbaiki jawaban hingga mencapai skor ketuntasan 100 dan mengunduh <strong>Rapor PDF</strong>.`;
  }

  // 5. PRIORITAS KELIMA: Contoh 76 Kursi & 720 Kursi di Materi
  if (clean.includes('76') || clean.includes('720') || clean.includes('15') || clean.includes('contoh')) {
    lastUserMathQuestion = "contoh perbandingan 76 kursi dan 720 kursi di halaman Materi";
    return `<strong>Penjelasan Contoh Gedung di Halaman Materi (76 Kursi vs 720 Kursi):</strong><br>
    Diketahui baris pertama <strong><i>a</i> = 20 kursi</strong>, baris kedua 24 kursi, dan baris ketiga 28 kursi (selisih tiap baris <strong><i>b</i> = 24 − 20 = 4 kursi</strong>):<br>
    • <strong>Mengapa Baris ke-15 = 76 kursi?</strong> Karena yang ditanya hanya kursi di baris ke-15 saja (<i>U</i><sub>15</sub>):<br>
      <i>U</i><sub>15</sub> = 20 + (15 − 1) × 4 = 20 + (14 × 4) = 20 + 56 = <strong>76 kursi</strong>.<br>
    • <strong>Mengapa Total 15 Baris = 720 kursi?</strong> Karena yang ditanya adalah kapasitas total seluruh 15 baris (<i>S</i><sub>15</sub>):<br>
      <i>S</i><sub>15</sub> = (15 / 2) × (20 + 76) = (15 / 2) × 96 = 15 × 48 = <strong>720 kursi</strong>.`;
  }

  // 6. PRIORITAS KEENAM: Kenapa Pakai (n - 1)
  if (clean.includes('n - 1') || clean.includes('n − 1') || clean.includes('n-1') || clean.includes('kenapa pakai')) {
    lastUserMathQuestion = "mengapa rumus suku ke-n memakai (n - 1)b";
    return `<strong>Mengapa Rumus <i>U<sub>n</sub></i> Memakai (<i>n</i> − 1)<i>b</i>?</strong><br>
    Karena pada suku ke-1 (<i>U</i><sub>1</sub> = <i>a</i>) kita belum menambahkan selisih (<i>b</i>).<br>
    • Menuju suku ke-2 (<i>U</i><sub>2</sub>) kita menambahkan <strong>1 kali beda</strong> (<i>a</i> + 1<i>b</i>).<br>
    • Menuju suku ke-3 (<i>U</i><sub>3</sub>) kita menambahkan <strong>2 kali beda</strong> (<i>a</i> + 2<i>b</i>).<br>
    Sehingga untuk menuju suku ke-<i>n</i> (<i>U<sub>n</sub></i>), banyaknya penambahan beda selalu berkurang satu dari nomor urutnya, yaitu <strong>(<i>n</i> − 1) kali beda</strong>!`;
  }

  // 7. PRIORITAS KETUJUH: Kalkulator Ekspresi Hitung Langsung
  const mathExprMatch = clean.replace(/x|×/g, '*').replace(/:/g, '/').match(/[-+*/()0-9\s.]{3,}/);
  if (mathExprMatch && /[+\-*/]/.test(mathExprMatch[0]) && /\d/.test(mathExprMatch[0])) {
    try {
      const expr = mathExprMatch[0].trim();
      const res = Function(`"use strict"; return (${expr})`)();
      if (typeof res === 'number' && !isNaN(res)) {
        return `<strong>Hasil Perhitungan Matematika:</strong><br>Dari hitungan <code>${expr}</code>, diperoleh hasil = <strong>${res.toLocaleString('id-ID')}</strong>.`;
      }
    } catch (e) {}
  }

  // 8. PRIORITAS KEDELAPAN: Pola Beranda (14 atau 11)
  if (clean.includes('14') || clean.includes('11') || (clean.includes('2') && clean.includes('5'))) {
    return `<strong>Penjelasan Pola Beranda (2, 5, 8, 11, 14):</strong><br>Suku awal <i>a</i> = 2 dan selisih tetapnya <i>b</i> = 5 − 2 = 3. Maka suku ke-4 adalah 8 + 3 = <strong>11</strong>, dan suku ke-5 adalah 11 + 3 = <strong>14</strong>.`;
  }

  // 9. PRIORITAS KESEMBILAN: Pertanyaan tentang Soal / Kasus / Game yang sedang aktif
  if (clean.includes('soal') || clean.includes('kasus') || clean.includes('game') || clean.includes('langkah') || clean.includes('bimbing') || clean.includes('cara') || clean.includes('hitung') || clean.includes('salah') || clean.includes('jelaskan') || clean.includes('bantu') || clean.includes('its') || clean.includes('syanora')) {
    if (activePageId === 'page-numerasi') {
      return `<strong>Bimbingan Penyelesaian ${c.title}:</strong><br>• ${c.hints.join('<br>• ')}`;
    }
    if (activePageId === 'page-game') {
      return `<strong>Bimbingan Penyelesaian Mini-Game (${g.title}):</strong><br>• ${g.hints.join('<br>• ')}`;
    }
    if (clean.includes('salah')) {
      const valStr = document.getElementById('answer-input').value.trim();
      return buildDiagnosticFeedback(valStr !== '' ? Number(valStr) : lastStudentAttempt);
    }
    return `<strong>Bimbingan Penyelesaian Soal "${q.title}":</strong><br>${q.explaining}<br><br>• ${q.guiding.join('<br>• ')}`;
  }

  // 10. HANYA jika pertanyaan di luar konteks matematika
  return `Mohon maaf, pertanyaan mengenai <em>"${userText}"</em> berada di luar pembahasan materi Barisan dan Deret Aritmetika pada <strong>SYANORA</strong>.<br><br>Apakah kamu masih ingin mendiskusikan tentang <strong>${lastUserMathQuestion}</strong>, atau ingin kita bahas langkah penyelesaian soal pada halaman ini?`;
}

document.getElementById('btn-role-explain').addEventListener('click', triggerZetaExplaining);
document.getElementById('btn-role-guide').addEventListener('click', triggerZetaGuiding);
document.getElementById('guide-me-btn').addEventListener('click', triggerZetaGuiding);
document.getElementById('btn-role-feedback').addEventListener('click', triggerZetaFeedback);

document.getElementById('check-btn').addEventListener('click', () => {
  const valStr = document.getElementById('answer-input').value.trim();
  if (valStr === '') return;
  attemptCounter++;
  const val = Number(valStr);
  const list = QUESTION_BANK[currentCategory];
  const q = list[curPracticeIdx];
  const fb = document.getElementById('feedback-box');
  fb.hidden = false;

  if (val === q.answer) {
    fb.className = 'feedback correct';
    fb.innerHTML = `<strong>Jawaban Tepat (${q.answer} ${q.unit})!</strong><br>${q.summary}`;
    const nextBtn = document.getElementById('next-btn');
    nextBtn.hidden = false;
    nextBtn.textContent = (curPracticeIdx === list.length - 1) ? 'Selesai & Lihat Rapor Evaluasi' : 'Soal Berikutnya &rarr;';
    const partialScore = Math.round(((curPracticeIdx + 1) / list.length) * 100);
    updateStudentScoreRecord(currentCategory, partialScore);
    updateStudentScoreRecord('duration', document.getElementById('test-timer').textContent);
    playSoundEffect('success');
    recordLog(`${currentCategory.toUpperCase()} - ${q.title}`, val, 'Tuntas');
  } else {
    lastStudentAttempt = val;
    const stageNum = Math.min(practiceWrongCount + 1, q.guiding.length);
    fb.className = 'feedback try-again';
    fb.innerHTML = `<strong>Jawaban ${val} ${q.unit} belum tepat (Percobaan ke-${practiceWrongCount + 1}).</strong><br>Jawaban salahmu telah dicatat di kotak kuning di atas beserta <strong>Petunjuk Bertahap ${stageNum}</strong>!`;
    showProgressivePracticeHint(val);
    appendZetaMessage('feedback', buildDiagnosticFeedback(val));
    practiceWrongCount++;
    playSoundEffect('shock');
    recordLog(`${currentCategory.toUpperCase()} - ${q.title}`, val, `Salah (Muncul Hint Tahap ${stageNum})`);
  }
});

document.getElementById('next-btn').addEventListener('click', () => {
  const list = QUESTION_BANK[currentCategory];
  if (curPracticeIdx < list.length - 1) loadPracticeQuestion(curPracticeIdx + 1);
  else finishCategoryAndShowReport();
});

document.querySelectorAll('.chip-btn[data-prompt]').forEach(btn => {
  btn.addEventListener('click', () => {
    const p = btn.getAttribute('data-prompt');
    appendZetaMessage('', p, true);
    setTimeout(() => {
      appendZetaMessage('guide', generateSmartContextualReply(p, false));
      playSoundEffect('click');
    }, 250);
  });
});

document.getElementById('chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const inp = document.getElementById('chat-input');
  const val = inp.value.trim();
  if (!val) return;
  appendZetaMessage('', val, true);
  inp.value = '';
  setTimeout(() => {
    appendZetaMessage('guide', generateSmartContextualReply(val, false));
    playSoundEffect('click');
  }, 250);
});

function appendGlobalZetaBubble(htmlContent, isUser = false) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`;
  if (isUser) div.textContent = htmlContent;
  else div.innerHTML = `<span class="role-tag role-explain">ZETA AI</span><br>${htmlContent}`;
  globalChatMessages.appendChild(div);
  globalChatMessages.scrollTop = globalChatMessages.scrollHeight;
}

document.querySelectorAll('.global-prompt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const p = btn.getAttribute('data-gprompt');
    appendGlobalZetaBubble(p, true);
    setTimeout(() => {
      appendGlobalZetaBubble(generateSmartContextualReply(p, true), false);
      playSoundEffect('click');
    }, 250);
  });
});

document.getElementById('global-chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const inp = document.getElementById('global-chat-input');
  const val = inp.value.trim();
  if (!val) return;
  appendGlobalZetaBubble(val, true);
  inp.value = '';
  setTimeout(() => {
    appendGlobalZetaBubble(generateSmartContextualReply(val, true), false);
    playSoundEffect('click');
  }, 250);
});

// 13. RAPOR KOMPREHENSIF SISWA (HANYA UNDUH PDF UNTUK SISWA) & KOMENTAR WAJIB
const printReportBtn = document.getElementById('print-report-btn');
const submitReflectionBtn = document.getElementById('submit-reflection-btn');
const studentReflectionInput = document.getElementById('student-reflection-input');

submitReflectionBtn.addEventListener('click', () => {
  const commentVal = studentReflectionInput.value.trim();
  if (!commentVal) {
    alert('Silakan tuliskan komentar atau kesan singkatmu terlebih dahulu sebelum mengunduh rapor!');
    playSoundEffect('shock');
    return;
  }
  updateStudentScoreRecord('comment', commentVal);
  recordLog('Refleksi & Komentar Siswa', commentVal, 'Tersimpan');
  document.getElementById('reflection-saved-msg').hidden = false;
  document.getElementById('rep-student-comment-display').textContent = `"${commentVal}"`;
  printReportBtn.disabled = false;
  printReportBtn.textContent = 'Unduh / Cetak Rapor (PDF)';
  playSoundEffect('success');
});

function finishCategoryAndShowReport() {
  isPracticeFinished = true;
  stopPracticeTimer();
  updateStudentScoreRecord(currentCategory, 100);
  updateStudentScoreRecord('duration', document.getElementById('test-timer').textContent);

  document.getElementById('practice-workspace').hidden = true;
  document.getElementById('final-report-card').hidden = false;

  const db = getMasterDatabase();
  const rec = currentUser && db.scores[currentUser.id] ? db.scores[currentUser.id] : { resetCount: 0, resetNote: '0/3', comment: '-' };

  const isPrivileged = currentUser && ['researcher', 'teacher', 'validator', 'admin'].includes(currentUser.role);
  document.getElementById('report-role-badge').textContent = isPrivileged
    ? `LAPORAN ANALITIK (${currentUser.roleLabel})`
    : 'LAPORAN CAPAIAN NUMERASI INDIVIDU SISWA';

  const catTitles = { utama: 'Latihan Utama (5 Soal)', tambahan: 'Latihan Tambahan (5 Soal)', pr: 'Tugas / PR Rumah (5 Soal)' };
  document.getElementById('rep-name').textContent = currentUser ? currentUser.name : 'Siswa';
  document.getElementById('rep-school').textContent = currentUser ? (currentUser.school || 'SMA') : '-';
  document.getElementById('rep-category').textContent = catTitles[currentCategory];
  document.getElementById('rep-time').textContent = document.getElementById('test-timer').textContent;
  document.getElementById('rep-reset-status').textContent = rec.resetNote || `${rec.resetCount || 0} / 3 Kali Reset`;

  document.getElementById('rep-competency-bars').innerHTML = `
    <div class="comp-item"><strong>1. Formulate (Merumuskan Informasi a & n):</strong> <span style="color:#059669; font-weight:700;">Sangat Baik (100%)</span></div>
    <div class="comp-item"><strong>2. Formulate (Mengenali Pola Beda + / −):</strong> <span style="color:#059669; font-weight:700;">Sangat Baik (100%)</span></div>
    <div class="comp-item"><strong>3. Employ (Memilih & Menghitung Model Uₙ / Sₙ):</strong> <span style="color:#059669; font-weight:700;">Tuntas Terbimbing</span></div>
    <div class="comp-item"><strong>4. Interpret (Menafsirkan Keputusan Kontekstual):</strong> <span style="color:#059669; font-weight:700;">Sangat Baik (100%)</span></div>
  `;

  const independenceNote = aiHelpCounter <= 2
    ? `Siswa menyelesaikan paket soal dengan tingkat kemandirian sangat tinggi (hanya menggunakan ${aiHelpCounter} petunjuk bantuan ZETA).`
    : `Siswa mencapai ketuntasan penuh (100%) melalui pendampingan bertahap ZETA sebanyak ${aiHelpCounter} kali dan ${attemptCounter} percobaan menjawab.`;
  document.getElementById('rep-zeta-diagnostic-note').textContent = independenceNote;
  document.getElementById('rep-student-comment-display').textContent = rec.comment && rec.comment !== '-' ? `"${rec.comment}"` : 'Belum diisi';

  if (rec.comment && rec.comment !== '-') {
    studentReflectionInput.value = rec.comment;
    printReportBtn.disabled = false;
    printReportBtn.textContent = 'Unduh / Cetak Rapor (PDF)';
  } else {
    printReportBtn.disabled = true;
    printReportBtn.textContent = 'Unduh Rapor (PDF) [Isi Komentar Dulu]';
  }

  const researcherBox = document.getElementById('researcher-only-report-section');
  if (isPrivileged) {
    researcherBox.hidden = false;
    document.getElementById('researcher-diagnostic-table').innerHTML = `<table class="case-table"><thead><tr><th>Total Percobaan</th><th>Frekuensi Bantuan ZETA</th><th>Riwayat Reset Siswa</th><th>Status Ketuntasan</th></tr></thead><tbody><tr><td>${attemptCounter} Percobaan</td><td>${aiHelpCounter} Kali Petunjuk</td><td>${rec.resetNote}</td><td>Tuntas (Mastery 100%)</td></tr></tbody></table>`;
  } else {
    researcherBox.hidden = true;
  }

  const list = QUESTION_BANK[currentCategory];
  document.getElementById('report-details-list').innerHTML = list.map((q, i) => `
    <div style="background:#f8fafc; padding:12px; border-radius:10px; border:1px solid #dbe3ef; margin-top:8px;">
      <strong>${i + 1}. ${q.title} (${q.indicator})</strong>
      <p style="font-size:13px; color:#047857; font-weight:700; margin:3px 0;">Kunci Jawaban: ${q.answer} ${q.unit}</p>
      <p style="font-size:12.5px; color:#334155;">${q.summary}</p>
    </div>
  `).join('');

  saveToLeaderboard();
  playSoundEffect('success');
}

document.getElementById('back-to-practice-btn').addEventListener('click', () => {
  document.getElementById('practice-workspace').hidden = false;
  document.getElementById('final-report-card').hidden = true;
});
printReportBtn.addEventListener('click', () => window.print());

const defaultLeaders = [
  { name: "PUJA TERESSA FAWENSI", school: "SMA Negeri 1 Palembang", score: 100, time: "02:15", univ: "UNSRI" },
  { name: "Rahmat", school: "SMA Negeri 1 Palembang", score: 100, time: "02:30", univ: "UNSRI" },
  { name: "Ocen", school: "SMA Negeri 1 Palembang", score: 100, time: "02:45", univ: "ITB" }
];

function saveToLeaderboard() {
  if (!currentUser) return;
  const stored = JSON.parse(localStorage.getItem('SYANORA_LEADERBOARD') || JSON.stringify(defaultLeaders));
  const entry = { name: currentUser.name, school: currentUser.school || 'SMA', score: 100, time: document.getElementById('test-timer').textContent, univ: currentUser.univ || 'PTN' };
  const idx = stored.findIndex(x => x.name.toLowerCase() === currentUser.name.toLowerCase());
  if (idx >= 0) stored[idx] = entry;
  else stored.unshift(entry);
  localStorage.setItem('SYANORA_LEADERBOARD', JSON.stringify(stored.slice(0, 5)));
  renderLeaderboard();
}

function renderLeaderboard() {
  const stored = JSON.parse(localStorage.getItem('SYANORA_LEADERBOARD') || JSON.stringify(defaultLeaders));
  document.getElementById('leaderboard-podium').innerHTML = stored.slice(0, 3).map((u, idx) => `<div class="rank-card ${idx === 0 ? 'rank-1' : ''}"><div class="rank-badge">#${idx + 1}</div><div><strong>${u.name}</strong><p style="font-size:12px; color:var(--text-muted);">${u.school} · Target: ${u.univ}</p><span style="font-size:12px; font-weight:700; color:var(--primary);">Skor: ${u.score} | Waktu: ${u.time}</span></div></div>`).join('');
}

function getShareMessage() {
  const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
  const shareUrl = isLocal ? PUBLIC_PRODUCTION_URL : window.location.origin;
  const userName = currentUser ? currentUser.name : 'Siswa';
  return `Saya (${userName}) telah menuntaskan tantangan Kemampuan Numerasi Barisan & Deret Aritmetika di platform SYANORA dengan Skor 100! Uji penalaranmu di: ${shareUrl}`;
}

document.getElementById('share-wa-btn').addEventListener('click', () => window.open(`https://wa.me/?text=${encodeURIComponent(getShareMessage())}`, '_blank'));
document.getElementById('share-ig-btn').addEventListener('click', () => { navigator.clipboard.writeText(getShareMessage()); window.open('https://instagram.com', '_blank'); });
document.getElementById('copy-link-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(getShareMessage());
  alert(`Pesan pencapaian SYANORA berhasil disalin:\n\n"${getShareMessage()}"`);
  playSoundEffect('success');
});

loadPracticeQuestion(0);

// 14. PROFIL PENGGUNA
const profileEditMode = document.getElementById('profile-edit-mode');
const profileViewMode = document.getElementById('profile-view-mode');
const profName = document.getElementById('prof-name');
const profSchool = document.getElementById('prof-school');
const profGender = document.getElementById('prof-gender');
const profHobbySelect = document.getElementById('prof-hobby-select');
const profHobbyCustom = document.getElementById('prof-hobby-custom');
const customHobbyField = document.getElementById('custom-hobby-field');
const profUniv = document.getElementById('prof-univ');
const profIg = document.getElementById('prof-ig');
const avatarPreview = document.getElementById('avatar-preview');
const photoZoom = document.getElementById('photo-zoom');
const photoRotate = document.getElementById('photo-rotate');
const photoPosX = document.getElementById('photo-pos-x');
const photoPosY = document.getElementById('photo-pos-y');
const photoFilter = document.getElementById('photo-filter');

profHobbySelect.addEventListener('change', () => { customHobbyField.hidden = (profHobbySelect.value !== 'Lainnya'); });

function getTransformStyleString() {
  return `translate(${photoPosX.value}px, ${photoPosY.value}px) scale(${Number(photoZoom.value) / 100}) rotate(${photoRotate.value}deg)`;
}
function applyPhotoStyle() {
  const img = avatarPreview.querySelector('img');
  if (!img) return;
  img.style.transform = getTransformStyleString();
  img.style.filter = photoFilter.value;
}
[photoZoom, photoRotate, photoPosX, photoPosY, photoFilter].forEach(el => el.addEventListener('input', applyPhotoStyle));

function applyGenderTheme(genderVal) {
  const isFemale = genderVal === 'Perempuan';
  [profileEditMode, profileViewMode].forEach(box => {
    box.classList.toggle('theme-female', isFemale);
    box.classList.toggle('theme-male', !isFemale);
  });
}
profGender.addEventListener('change', () => applyGenderTheme(profGender.value));

function loadUserProfileUI() {
  if (!currentUser) return;
  const uid = currentUser.id;
  const saved = JSON.parse(localStorage.getItem(`SYANORA_PROFILE_${uid}`) || 'null');
  const data = saved || currentUser;
  profName.value = data.name || '';
  profSchool.value = data.school || '';
  profGender.value = data.gender || 'Perempuan';
  profUniv.value = data.univ || '';
  profIg.value = data.ig || '';
  const savedImg = localStorage.getItem(`SYANORA_AVATAR_${uid}`);
  if (savedImg) {
    avatarPreview.innerHTML = `<img src="${savedImg}" alt="Avatar">`;
    applyPhotoStyle();
  }
  applyGenderTheme(profGender.value);
  if (saved && saved.isComplete) renderSavedProfileView(saved, savedImg);
}

function renderSavedProfileView(data, imgSrc) {
  profileEditMode.hidden = true;
  profileViewMode.hidden = false;
  applyGenderTheme(data.gender);
  const viewAvatar = document.getElementById('view-avatar-box');
  viewAvatar.innerHTML = imgSrc ? `<img src="${imgSrc}" style="transform:${data.transform || 'none'}; filter:${data.filter || 'none'};">` : data.name.charAt(0).toUpperCase();
  document.getElementById('view-prof-name').textContent = data.name;
  document.getElementById('view-prof-school').textContent = data.school;
  document.getElementById('view-prof-gender').textContent = data.gender;
  document.getElementById('view-prof-hobby').textContent = `Hobi: ${data.hobby}`;
  document.getElementById('view-prof-univ').textContent = `Kampus Impian: ${data.univ}`;
  document.getElementById('view-prof-ig').href = data.ig.startsWith('http') ? data.ig : `https://instagram.com/${data.ig.replace(/^@/, '')}`;
}

document.getElementById('edit-profile-trigger-btn').addEventListener('click', () => {
  profileViewMode.hidden = true;
  profileEditMode.hidden = false;
});

document.getElementById('avatar-file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file || !currentUser) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    localStorage.setItem(`SYANORA_AVATAR_${currentUser.id}`, ev.target.result);
    avatarPreview.innerHTML = `<img src="${ev.target.result}">`;
    applyPhotoStyle();
    updateTopProfileHud();
  };
  reader.readAsDataURL(file);
});

document.getElementById('save-profile-btn').addEventListener('click', () => {
  if (!currentUser) return;
  const nameVal = profName.value.trim();
  const schoolVal = profSchool.value.trim();
  const genderVal = profGender.value;
  const hobbyVal = profHobbySelect.value === 'Lainnya' ? profHobbyCustom.value.trim() : profHobbySelect.value;
  const univVal = profUniv.value.trim();
  const igVal = profIg.value.trim();
  const valMsg = document.getElementById('profile-validation-msg');
  if (!nameVal || !schoolVal || !genderVal || !hobbyVal || !univVal || !igVal) {
    valMsg.hidden = false;
    return;
  }
  valMsg.hidden = true;
  const profileObj = { id: currentUser.id, name: nameVal, school: schoolVal, gender: genderVal, hobby: hobbyVal, univ: univVal, ig: igVal, role: currentUser.role, roleLabel: currentUser.roleLabel, transform: getTransformStyleString(), filter: photoFilter.value, isComplete: true };
  localStorage.setItem(`SYANORA_PROFILE_${currentUser.id}`, JSON.stringify(profileObj));
  localStorage.setItem('SYANORA_ACTIVE_USER', JSON.stringify(profileObj));
  currentUser = profileObj;
  updateStudentScoreRecord('school', schoolVal);
  updateTopProfileHud();
  recordLog('Pembaruan Profil', `${nameVal} (${schoolVal})`, 'Tersimpan');

  const dirList = JSON.parse(localStorage.getItem('SYANORA_CLASS_DIRECTORY') || '[]');
  const existIdx = dirList.findIndex(d => d.id === currentUser.id);
  if (existIdx >= 0) dirList[existIdx] = profileObj;
  else dirList.unshift(profileObj);
  localStorage.setItem('SYANORA_CLASS_DIRECTORY', JSON.stringify(dirList));
  renderSavedProfileView(profileObj, localStorage.getItem(`SYANORA_AVATAR_${currentUser.id}`));
  renderClassmatesDirectory();
  playSoundEffect('success');
});

function renderClassmatesDirectory() {
  const stored = JSON.parse(localStorage.getItem('SYANORA_CLASS_DIRECTORY') || '[]');
  document.getElementById('classmates-grid').innerHTML = stored.map(p => {
    const igUrl = p.ig.startsWith('http') ? p.ig : `https://instagram.com/${p.ig.replace(/^@/, '')}`;
    return `<div class="classmate-card"><strong>${p.name}</strong><p style="font-size:12px;">${p.school} · Hobi: ${p.hobby}</p><p style="font-size:12px;">Kampus Impian: ${p.univ}</p><a href="${igUrl}" target="_blank" class="ig-link-btn" style="margin-top:8px; font-size:11px; padding:5px 10px;">Instagram</a></div>`;
  }).join('');
}

// 15. EKSPOR DATABASE KHUSUS GURU (02), VALIDATOR (01), & PENELITI (EXCEL, CSV, PDF)
document.getElementById('export-excel-btn').addEventListener('click', () => {
  const db = getMasterDatabase();
  if (typeof XLSX === 'undefined') return;
  const wb = XLSX.utils.book_new();

  const scoreSheetData = Object.values(db.scores).map((s, i) => ({
    "No": i + 1, "Username": s.username, "Nama Lengkap": s.name, "Sekolah": s.school,
    "Studi Kasus": `${s.casesDone} / 5`, "Skor Game": s.gameScore, "Latihan Utama": s.utama,
    "Latihan Tambahan": s.tambahan, "Tugas PR": s.pr, "Catatan Reset": s.resetNote || '0/3',
    "Komentar & Masukan Siswa": s.comment || '-'
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scoreSheetData), "Rekap_Nilai_dan_Reset");

  const discSheetData = db.discussions.map((d, i) => ({
    "No": i + 1, "Waktu": d.time, "Username": d.username, "Nama": d.name, "Pesan Diskusi": d.message, "Lampiran": d.attachment
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(discSheetData), "Rekap_Diskusi");

  const logSheetData = db.logs.map((l, i) => ({
    "No": i + 1, "Waktu": l.time, "Username": l.id, "Nama": l.name, "Modul": l.module, "Respons / Catatan": l.answer, "Status": l.status
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logSheetData), "Log_Aktivitas_dan_Reset");

  XLSX.writeFile(wb, "Database_Lengkap_SYANORA.xlsx");
  playSoundEffect('success');
});

document.getElementById('export-csv-btn').addEventListener('click', () => {
  const db = getMasterDatabase();
  let csv = 'Kategori,Username,Nama,Sekolah_atau_Waktu,Detail_Capaian,Catatan_Reset,Komentar_Siswa\n';
  Object.values(db.scores).forEach(s => {
    csv += `"REKAP_SISWA","${s.username}","${s.name}","${s.school}","Kasus:${s.casesDone}/5 | Game:${s.gameScore} | Utama:${s.utama}","${s.resetNote || '0/3'}","${(s.comment || '-').replace(/"/g, '""')}"\n`;
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = 'Database_SYANORA.csv';
  a.click();
});

document.getElementById('export-pdf-screen-btn').addEventListener('click', () => window.print());

renderAllAdminScreens();