// =========================================================================
// ANORA — INTELLIGENT TUTORING SYSTEM (CT, NUMERASI, & ZETA AI)
// =========================================================================

// 1. DAFTAR PENGGUNA RESMI (Termasuk musyhapmiwa dengan PIN bebas)
const ALLOWED_USERS = {
  "miwa": { name: "Miwa", school: "SMA Negeri 1 Palembang", gender: "Perempuan", pin: "0808", role: "admin", hobby: "Membaca & Literasi", univ: "Universitas Sriwijaya", ig: "@miwa.research" },
  "mumu": { name: "Mumu", school: "SMA Negeri 1 Palembang", gender: "Laki-laki", pin: "0808", role: "student", hobby: "Bulu Tangkis", univ: "Institut Teknologi Bandung", ig: "@mumu.student" },
  "musyhapmiwa": { name: "Musyhap Miwa", school: "SMA Negeri Sumatera Selatan", gender: "Perempuan", pin: "*", role: "admin", hobby: "Berkuda", univ: "Universitas Gadjah Mada", ig: "@musyhapmiwa" }
};

let currentUser = null;
const researchLogs = [];
let aiHelpCounter = 0;
let attemptCounter = 0;

// 2. SISTEM AUDIO, MUSIK LATAR INSTRUMEN, EFEK GAME & SUARA KAGET (BUZZER)
let musicEnabled = true;
let audioCtx = null;
let bgmTimer = null;
let currentMode = 'ambient';

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSoundEffect(type = 'success') {
  if (!musicEnabled) return;
  try {
    initAudio();
    const now = audioCtx.currentTime;

    if (type === 'success') {
      // Nada kemenangan harmonis
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } else if (type === 'shock') {
      // Efek kaget / salah di game & latihan
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(95, now + 0.35);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.start(now);
      osc.stop(now + 0.38);
    } else {
      // Klik halus
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {}
}

function startBackgroundMusic(mode = 'ambient') {
  currentMode = mode;
  if (bgmTimer) clearInterval(bgmTimer);
  const ambientNotes = [261.63, 329.63, 392.00, 493.88, 523.25, 392.00];
  const focusNotes = [293.66, 349.23, 440.00, 523.25, 440.00, 349.23];
  let idx = 0;

  bgmTimer = setInterval(() => {
    if (!musicEnabled) return;
    try {
      initAudio();
      const seq = currentMode === 'focus' ? focusNotes : ambientNotes;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(seq[idx % seq.length], audioCtx.currentTime);
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0008, audioCtx.currentTime + 1.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.6);
      idx++;
    } catch (e) {}
  }, 2200);
}

document.getElementById('music-toggle-btn').addEventListener('click', (e) => {
  musicEnabled = !musicEnabled;
  e.target.textContent = musicEnabled ? 'Audio: Aktif' : 'Audio: Nonaktif';
  playSoundEffect('click');
});

// 3. AUTENTIKASI LOGIN (Termasuk musyhapmiwa PIN Bebas)
const authOverlay = document.getElementById('auth-overlay');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const guideModal = document.getElementById('guide-modal');

function applyUserSession(userObj) {
  currentUser = userObj;
  authOverlay.hidden = true;
  startBackgroundMusic('ambient');

  const adminTab = document.getElementById('nav-researcher-tab');
  if (adminTab) adminTab.hidden = (userObj.role !== 'admin');

  loadUserProfileUI();
  renderClassmatesDirectory();
  renderLeaderboard();
}

const savedSession = localStorage.getItem('ANORA_ACTIVE_USER');
if (savedSession) {
  try {
    applyUserSession(JSON.parse(savedSession));
  } catch (e) {
    authOverlay.hidden = false;
  }
}

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const idVal = document.getElementById('auth-id-input').value.trim().toLowerCase();
  const pinVal = document.getElementById('auth-pin-input').value.trim();

  const account = ALLOWED_USERS[idVal];
  const isPinValid = account && (account.pin === '*' || account.pin === pinVal);

  if (!isPinValid) {
    authError.hidden = false;
    playSoundEffect('shock');
    return;
  }

  authError.hidden = true;
  const savedProfile = JSON.parse(localStorage.getItem(`ANORA_PROFILE_${idVal}`) || 'null');
  const userObj = savedProfile || {
    id: idVal,
    name: account.name,
    school: account.school,
    gender: account.gender,
    hobby: account.hobby,
    univ: account.univ,
    ig: account.ig,
    role: account.role,
    isComplete: false
  };
  userObj.role = account.role;

  localStorage.setItem('ANORA_ACTIVE_USER', JSON.stringify(userObj));
  playSoundEffect('success');
  applyUserSession(userObj);
});

['open-guide-btn', 'guide-top-btn'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => { guideModal.hidden = false; playSoundEffect('click'); });
});
['close-guide-btn', 'close-guide-btn-bottom'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => { guideModal.hidden = true; playSoundEffect('click'); });
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('ANORA_ACTIVE_USER');
  location.reload();
});

// 4. NAVIGASI MULTI-PAGE & TIMER LATIHAN
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
  navTabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-target') === targetId));
  pageSections.forEach(p => p.classList.toggle('active', p.id === targetId));
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (targetId === 'page-practice') {
    startPracticeTimer();
    startBackgroundMusic('focus');
  } else {
    stopPracticeTimer();
    startBackgroundMusic('ambient');
  }
  playSoundEffect('click');
}

navTabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchPage(btn.getAttribute('data-target')));
});
document.querySelectorAll('.nav-jump').forEach(btn => {
  btn.addEventListener('click', () => switchPage(btn.getAttribute('data-target')));
});
document.getElementById('brand-home-trigger').addEventListener('click', () => switchPage('page-home'));

// 5. INTERAKSI TANDA TANYA (?) DI BERANDA
document.getElementById('reveal-pattern-btn').addEventListener('click', (e) => {
  e.target.textContent = '14';
  e.target.style.background = '#34d399';
  document.getElementById('pattern-explanation').innerHTML = '<strong>Tepat sekali! Nilai suku ke-5 adalah 14.</strong><br>Setiap suku bertambah secara konstan sebesar +3 (<i>b</i> = 3), sehingga 11 + 3 = 14.';
  playSoundEffect('success');
});

// 6. LABORATORIUM GRAFIK FLEKSIBEL
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
    const heightPx = Math.max(16, Math.round((Math.abs(val) / maxAbs) * 165));
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

// =========================================================================
// 7. STUDI KASUS NUMERASI (5 KASUS KONTEKSTUAL & SISTEM PENGUNCI GATED)
// =========================================================================
const numeracyCases = [
  {
    badge: "KASUS 01 · LITERASI FINANSIAL",
    title: "Perencanaan Dana Pembelian Laptop",
    story: `<p>Raka berencana membeli sebuah laptop untuk menunjang pembelajaran seharga <strong>Rp5.000.000</strong> (5.000 ribu rupiah). Ia menabung selama <strong>8 bulan</strong> dengan penambahan nominal tetap setiap bulannya.</p>
            <p>Pada bulan ke-1 ia menabung Rp300.000, bulan ke-2 sebesar Rp380.000, dan bulan ke-3 sebesar Rp460.000.</p>`,
    table: `<table class="case-table">
              <thead><tr><th>Bulan 1 (<i>a</i>)</th><th>Bulan 2 (<i>U</i><sub>2</sub>)</th><th>Bulan 3 (<i>U</i><sub>3</sub>)</th><th>Durasi</th><th>Harga Laptop</th></tr></thead>
              <tbody><tr><td>300 ribu</td><td>380 ribu</td><td>460 ribu</td><td>8 Bulan</td><td>5.000 ribu</td></tr></tbody>
            </table>`,
    q1: "1. Berapa uang yang ditabung Raka khusus pada bulan ke-8 (U₈)?", u1: "ribu rupiah", a1: 860,
    q2: "2. Berapa TOTAL seluruh tabungan Raka setelah 8 bulan penuh (S₈)?", u2: "ribu rupiah", a2: 4640,
    q3: "3. Berapa kekurangan dana yang masih harus ditambahkan Raka?", u3: "ribu rupiah", a3: 360,
    hint: "Diketahui a = 300, b = 80, n = 8. Hitung U₈ = 300 + 7(80), lalu S₈ = 4 × (300 + U₈). Kurangkan 5.000 dengan S₈.",
    aiHelp: "ZETA memandu: Перtama, selisih tabungan per bulan adalah 380 − 300 = 80 ribu. Maka pada bulan ke-8, U₈ = 300 + (7 × 80) = 860 ribu. Total 8 bulan adalah S₈ = (8/2) × (300 + 860) = 4.640 ribu. Selisih terhadap harga laptop 5.000 ribu adalah 360 ribu.",
    expl: "U₈ = 860 ribu rupiah, total S₈ = 4.640 ribu rupiah, dan kekurangan dana sebesar 360 ribu rupiah."
  },
  {
    badge: "KASUS 02 · ENERGI TERBARUKAN",
    title: "Penghematan Listrik Panel Surya Sekolah",
    story: `<p>SMA Nusantara memasang panel surya secara bertahap. Pada bulan pertama, penghematan listrik tercatat sebesar <strong>120 kWh</strong>, bulan kedua <strong>150 kWh</strong>, dan bulan ketiga <strong>180 kWh</strong>.</p>
            <p>Sekolah menargetkan total penghematan minimal <strong>2.500 kWh</strong> dalam <strong>10 bulan</strong> pertama.</p>`,
    table: `<table class="case-table">
              <thead><tr><th>Bulan 1 (<i>a</i>)</th><th>Bulan 2 (<i>U</i><sub>2</sub>)</th><th>Bulan 3 (<i>U</i><sub>3</sub>)</th><th>Masa Evaluasi</th><th>Target Hemat</th></tr></thead>
              <tbody><tr><td>120 kWh</td><td>150 kWh</td><td>180 kWh</td><td>10 Bulan</td><td>2.500 kWh</td></tr></tbody>
            </table>`,
    q1: "1. Berapa besar penghematan listrik pada bulan ke-10 (U₁₀)?", u1: "kWh", a1: 390,
    q2: "2. Berapa TOTAL penghematan listrik selama 10 bulan (S₁₀)?", u2: "kWh", a2: 2550,
    q3: "3. Berapa kelebihan penghematan yang dicapai dibanding target sekolah?", u3: "kWh", a3: 50,
    hint: "Diketahui a = 120, b = 30, n = 10. Hitung U₁₀ = 120 + 9(30), lalu S₁₀ = 5 × (120 + U₁₀). Kurangkan S₁₀ dengan 2.500.",
    aiHelp: "ZETA memandu: Pertambahan hemat listrik per bulan adalah b = 30 kWh. Bulan ke-10 mencapai U₁₀ = 120 + 270 = 390 kWh. Akumulasi 10 bulan S₁₀ = 5 × (120 + 390) = 2.550 kWh, melampaui target 2.500 kWh sebesar 50 kWh.",
    expl: "U₁₀ = 390 kWh, S₁₀ = 2.550 kWh, melampaui target sebesar 50 kWh."
  },
  {
    badge: "KASUS 03 · LINGKUNGAN (POLA MENURUN)",
    title: "Program Pengurangan Sampah Plastik",
    story: `<p>Melalui program kantin ramah lingkungan, volume sampah plastik berhasil diturunkan secara konsisten setiap minggu. Minggu ke-1 tercatat <strong>95 kg</strong>, minggu ke-2 turun menjadi <strong>88 kg</strong>, dan minggu ke-3 menjadi <strong>81 kg</strong>.</p>`,
    table: `<table class="case-table">
              <thead><tr><th>Minggu 1 (<i>a</i>)</th><th>Minggu 2 (<i>U</i><sub>2</sub>)</th><th>Minggu 3 (<i>U</i><sub>3</sub>)</th><th>Penurunan Mingguan (<i>b</i>)</th></tr></thead>
              <tbody><tr><td>95 kg</td><td>88 kg</td><td>81 kg</td><td>−7 kg / minggu</td></tr></tbody>
            </table>`,
    q1: "1. Berapa berat sampah plastik pada minggu ke-10 (U₁₀)?", u1: "kg", a1: 32,
    q2: "2. Berapa berat sampah plastik pada minggu ke-12 (U₁₂)?", u2: "kg", a2: 18,
    q3: "3. Berapa total akumulasi sampah plastik selama 10 minggu pertama (S₁₀)?", u3: "kg", a3: 635,
    hint: "Karena menurun, gunakan b = −7. Hitung U₁₀ = 95 + 9(−7), U₁₂ = 95 + 11(−7), dan S₁₀ = 5 × (95 + U₁₀).",
    aiHelp: "ZETA memandu: Awas tanda negatif! Karena berkurang 7 kg tiap minggu, b = −7. Maka U₁₀ = 95 − 63 = 32 kg. Untuk minggu ke-12, U₁₂ = 95 − 77 = 18 kg. Jumlah 10 minggu pertama adalah S₁₀ = 5 × (95 + 32) = 635 kg.",
    expl: "U₁₀ = 32 kg, U₁₂ = 18 kg, dan S₁₀ = 635 kg."
  },
  {
    badge: "KASUS 04 · AGRIBISNIS PERKEBUNAN",
    title: "Peningkatan Panen Kebun Hidroponik Siswa",
    story: `<p>Koperasi siswa mengelola kebun sayur hidroponik. Panen periode ke-1 menghasilkan <strong>40 ikat</strong>, periode ke-2 sebanyak <strong>55 ikat</strong>, dan periode ke-3 sebanyak <strong>70 ikat</strong>. Koperasi mendapat pesanan kontrak total <strong>600 ikat</strong> untuk <strong>6 periode panen</strong>.</p>`,
    table: `<table class="case-table">
              <thead><tr><th>Periode 1 (<i>a</i>)</th><th>Periode 2 (<i>U</i><sub>2</sub>)</th><th>Periode 3 (<i>U</i><sub>3</sub>)</th><th>Kontrak Pesanan</th></tr></thead>
              <tbody><tr><td>40 ikat</td><td>55 ikat</td><td>70 ikat</td><td>600 ikat (6 Periode)</td></tr></tbody>
            </table>`,
    q1: "1. Berapa hasil panen pada periode ke-6 (U₆)?", u1: "ikat", a1: 115,
    q2: "2. Berapa TOTAL hasil panen selama 6 periode (S₆)?", u2: "ikat", a2: 465,
    q3: "3. Berapa kekurangan ikat sayur untuk memenuhi kontrak pesanan?", u3: "ikat", a3: 135,
    hint: "Diketahui a = 40, b = 15, n = 6. Hitung U₆ = 40 + 5(15), lalu S₆ = 3 × (40 + U₆). Kurangkan 600 dengan S₆.",
    aiHelp: "ZETA memandu: Selisih kenaikan panen adalah b = 15 ikat. Periode ke-6 menghasilkan U₆ = 40 + 75 = 115 ikat. Total 6 periode S₆ = 3 × (40 + 115) = 465 ikat. Kekurangan untuk kontrak 600 ikat adalah 600 − 465 = 135 ikat.",
    expl: "U₆ = 115 ikat, total S₆ = 465 ikat, sehingga masih kurang 135 ikat."
  },
  {
    badge: "KASUS 05 · ARSITEKTUR & KONSTRUKSI",
    title: "Penyusunan Tumpukan Pipa Proyek",
    story: `<p>Pada lokasi pembangunan laboratorium sekolah, pipa saluran air ditumpuk secara berjenjang. Lapisan paling bawah (ke-1) memuat <strong>50 pipa</strong>, lapisan ke-2 di atasnya <strong>46 pipa</strong>, lapisan ke-3 memuat <strong>42 pipa</strong>, dan seterusnya hingga terdiri atas <strong>8 lapisan</strong>.</p>`,
    table: `<table class="case-table">
              <thead><tr><th>Lapisan 1 (<i>a</i>)</th><th>Lapisan 2 (<i>U</i><sub>2</sub>)</th><th>Lapisan 3 (<i>U</i><sub>3</sub>)</th><th>Banyak Lapisan (<i>n</i>)</th></tr></thead>
              <tbody><tr><td>50 pipa</td><td>46 pipa</td><td>42 pipa</td><td>8 Lapisan</td></tr></tbody>
            </table>`,
    q1: "1. Berapa banyak pipa pada lapisan paling atas / ke-8 (U₈)?", u1: "pipa", a1: 22,
    q2: "2. Berapa TOTAL seluruh pipa dalam tumpukan 8 lapisan tersebut (S₈)?", u2: "pipa", a2: 288,
    q3: "3. Jika proyek membutuhkan 300 pipa, berapa pipa tambahan yang diperlukan?", u3: "pipa", a3: 12,
    hint: "Pola berkurang 4 pipa tiap naik lapisan (b = −4). Hitung U₈ = 50 + 7(−4), lalu S₈ = 4 × (50 + U₈). Kurangkan 300 dengan S₈.",
    aiHelp: "ZETA memandu: Karena setiap naik lapisan jumlah pipa berkurang 4, maka b = −4. Lapisan ke-8 berisi U₈ = 50 − 28 = 22 pipa. Total seluruh tumpukan S₈ = 4 × (50 + 22) = 288 pipa. Tambahan untuk mencapai 300 pipa adalah 12 pipa.",
    expl: "Lapisan ke-8 berisi 22 pipa, total 8 lapisan 288 pipa, dan butuh tambahan 12 pipa."
  }
];

let activeCaseIdx = 0;
let unlockedCaseMax = 0;
const caseTabBtns = document.querySelectorAll('#case-tabs-container .case-tab');

function loadNumeracyCase(idx) {
  activeCaseIdx = idx;
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

caseTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetIdx = Number(btn.getAttribute('data-case'));
    if (targetIdx > unlockedCaseMax) {
      playSoundEffect('shock');
      alert('Selesaikan kasus saat ini dengan benar terlebih dahulu sebelum membuka kasus berikutnya!');
      return;
    }
    loadNumeracyCase(targetIdx);
    playSoundEffect('click');
  });
});

document.getElementById('hint-numerasi-btn').addEventListener('click', () => {
  const hBox = document.getElementById('numerasi-hint');
  hBox.hidden = false;
  hBox.innerHTML = `<strong>Petunjuk Rumus:</strong> ${numeracyCases[activeCaseIdx].hint}`;
  playSoundEffect('click');
});

document.getElementById('ai-case-help-btn').addEventListener('click', () => {
  const hBox = document.getElementById('numerasi-hint');
  hBox.hidden = false;
  hBox.innerHTML = `<strong>Bimbingan ZETA AI:</strong> ${numeracyCases[activeCaseIdx].aiHelp}`;
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
    fb.className = 'feedback correct';
    fb.innerHTML = `<strong>Analisis Tepat!</strong><br>${c.expl}`;
    if (activeCaseIdx === unlockedCaseMax && unlockedCaseMax < numeracyCases.length - 1) {
      unlockedCaseMax++;
    }
    loadNumeracyCase(activeCaseIdx);
    document.getElementById('numerasi-feedback').hidden = false;
    document.getElementById('numerasi-feedback').className = 'feedback correct';
    document.getElementById('numerasi-feedback').innerHTML = `<strong>Analisis Tepat!</strong><br>${c.expl}`;
    if (activeCaseIdx < numeracyCases.length - 1) {
      document.getElementById('next-case-btn').hidden = false;
    }
    playSoundEffect('success');
    recordLog(`Studi Kasus ${activeCaseIdx + 1}`, `${v1}, ${v2}, ${v3}`, 'Tuntas');
  } else {
    fb.className = 'feedback try-again';
    fb.innerHTML = `<strong>Masih terdapat jawaban yang belum tepat.</strong><br>Kamu wajib menyelesaikan kasus ini dengan benar sebelum lanjut ke kasus berikutnya. Klik tombol <strong>Petunjuk Rumus</strong> atau <strong>Bantuan ZETA AI</strong> di atas!`;
    playSoundEffect('shock');
    recordLog(`Studi Kasus ${activeCaseIdx + 1}`, `${v1}, ${v2}, ${v3}`, 'Perlu Perbaikan');
  }
});

document.getElementById('next-case-btn').addEventListener('click', () => {
  if (activeCaseIdx < numeracyCases.length - 1) {
    loadNumeracyCase(activeCaseIdx + 1);
    playSoundEffect('click');
  }
});
loadNumeracyCase(0);

// =========================================================================
// 8. MINI-GAME POLA BILANGAN (6 LEVEL + VISUAL BLOCKS + ON MIC SPEECH)
// =========================================================================
const gameLevels = [
  {
    badge: "LEVEL 1 / 6",
    title: "Menentukan Suku ke-6 Barisan Naik",
    desc: "Amati pola barisan bilangan di bawah ini, lalu tentukan nilai pada kotak tanda tanya (<i>U</i><sub>6</sub>)!",
    blocks: ["4", "7", "10", "13", "16", "?"],
    target: 19,
    hint: "Suku awal a = 4 dan selalu bertambah 3 (b = +3). Maka 16 + 3 = 19."
  },
  {
    badge: "LEVEL 2 / 6",
    title: "Tantangan Pola Menurun (Negatif)",
    desc: "Perhatikan barisan menurun berikut. Berapakah nilai suku ke-6 (<i>U</i><sub>6</sub>)?",
    blocks: ["20", "14", "8", "2", "−4", "?"],
    target: -10,
    hint: "Setiap langkah berkurang 6 (b = −6). Maka −4 dikurangi 6 menjadi −10."
  },
  {
    badge: "LEVEL 3 / 6",
    title: "Menemukan Suku Tengah (Ut)",
    desc: "Terdapat 5 suku barisan aritmetika. Berapakah nilai suku tengah (<i>U</i><sub>3</sub>) yang tepat?",
    blocks: ["12", "20", "?", "36", "44"],
    target: 28,
    hint: "Gunakan rumus suku tengah Ut = (a + Un) / 2 = (12 + 44) / 2 = 28."
  },
  {
    badge: "LEVEL 4 / 6",
    title: "Menghitung Akumulasi Deret 5 Suku (S₅)",
    desc: "Jumlahkan seluruh nilai pada kelima kartu bilangan berikut (<i>S</i><sub>5</sub>)!",
    blocks: ["10", "+ 15", "+ 20", "+ 25", "+ 30", "= ?"],
    target: 100,
    hint: "S₅ = (5 / 2) × (10 + 30) = 5 × 20 = 100."
  },
  {
    badge: "LEVEL 5 / 6",
    title: "Menyisipkan Bilangan Baru",
    desc: "Di antara angka 6 dan 30 disisipkan 2 bilangan baru hingga membentuk barisan aritmetika. Berapakah nilai suku ke-2 (angka pertama setelah 6)?",
    blocks: ["6", "?", "22", "30"],
    target: 14,
    hint: "Beda lama b = 30 − 6 = 24. Karena disisipkan k = 2 bilangan, beda baru b' = 24 / (2 + 1) = 8. Maka 6 + 8 = 14."
  },
  {
    badge: "LEVEL 6 / 6",
    title: "Tantangan Master: Deret Suku ke-8 (S₈)",
    desc: "Suatu deret aritmetika memiliki suku pertama 5 dan suku ke-8 adalah 40. Berapakah jumlah 8 suku pertamanya (<i>S</i><sub>8</sub>)?",
    blocks: ["U₁ = 5", "...", "U₈ = 40", "S₈ = ?"],
    target: 180,
    hint: "Gunakan S₈ = (8 / 2) × (a + U₈) = 4 × (5 + 40) = 180."
  }
];

let curGameIdx = 0;
let gameScore = 0;
let gameStreak = 0;
const gameSlider = document.getElementById('game-slider');
const gameSliderVal = document.getElementById('game-slider-val');
const gameFeedback = document.getElementById('game-feedback');
const gameHintBox = document.getElementById('game-hint-box');
const gameNextBtn = document.getElementById('game-next-btn');
const gameVisualBlocks = document.getElementById('game-visual-blocks');

function loadGameLevel(idx) {
  const g = gameLevels[idx];
  document.getElementById('game-level-badge').textContent = g.badge;
  document.getElementById('game-title').textContent = g.title;
  document.getElementById('game-desc').innerHTML = g.desc;
  gameVisualBlocks.innerHTML = g.blocks.map(b => `<div class="g-block ${b.includes('?') ? 'target-block' : ''}">${b}</div>`).join('');
  gameFeedback.hidden = true;
  gameHintBox.hidden = true;
  gameNextBtn.hidden = true;
}

gameSlider.addEventListener('input', () => {
  gameSliderVal.textContent = gameSlider.value;
});

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
    playSoundEffect('success');
    recordLog(`Game ${g.badge}`, val, 'Tuntas');
  } else {
    gameStreak = 0;
    document.getElementById('game-streak-badge').textContent = `Streak: 0`;
    gameFeedback.className = 'feedback try-again';
    gameFeedback.innerHTML = `<strong>Nilai ${val} belum tepat!</strong> Perhatikan kartu visual di atas atau klik Bantuan Petunjuk.`;
    playSoundEffect('shock');
  }
}

document.getElementById('game-submit-btn').addEventListener('click', () => {
  checkGameAnswer(Number(gameSlider.value));
});

// Fitur Jawab Pakai Suara (On Mic Web Speech API)
document.getElementById('game-voice-btn').addEventListener('click', () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const statusMsg = document.getElementById('voice-status-msg');
  statusMsg.hidden = false;

  if (!SpeechRecognition) {
    statusMsg.textContent = 'Browser perangkat ini belum mendukung pengenalan suara langsung. Silakan gunakan penggeser angka.';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'id-ID';
  statusMsg.textContent = 'Mikrofon aktif... Silakan ucapkan angka jawabanmu (misal: "sembilan belas" atau "seratus")!';

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
      statusMsg.textContent = `Terdengar: "${transcript}". Ucapkan dalam bentuk angka yang jelas.`;
    }
  };

  recognition.onerror = () => {
    statusMsg.textContent = 'Tidak dapat menangkap suara. Pastikan izin mikrofon browser telah diaktifkan.';
  };

  recognition.start();
});

document.getElementById('game-hint-btn').addEventListener('click', () => {
  gameHintBox.hidden = !gameHintBox.hidden;
  gameHintBox.innerHTML = `<strong>Petunjuk:</strong> ${gameLevels[curGameIdx].hint}`;
  playSoundEffect('click');
});

gameNextBtn.addEventListener('click', () => {
  curGameIdx = (curGameIdx + 1) % gameLevels.length;
  loadGameLevel(curGameIdx);
  playSoundEffect('click');
});
loadGameLevel(0);

// =========================================================================
// 9. DISKUSI ANTAR SISWA (JAM KIRIM, EDIT JAM, & MULTIMEDIA)
// =========================================================================
const discussionFeed = document.getElementById('discussion-feed');
const discussionForm = document.getElementById('discussion-form');
const discussionInput = document.getElementById('discussion-input');
const discFileInput = document.getElementById('disc-file-input');
const discAttachPreview = document.getElementById('disc-attach-preview');

function seedDiscussion() {
  const initialMsg = document.createElement('div');
  initialMsg.className = 'discussion-item';
  initialMsg.innerHTML = `
    <div class="disc-header">
      <strong>Mumu (SMA Negeri 1 Palembang)</strong>
      <span class="disc-time">Diposting pukul 08:15</span>
    </div>
    <p class="disc-text">Teman-teman, kalau soalnya menanyakan jumlah tabungan selama beberapa bulan penuh, berarti kita selalu menggunakan rumus deret <i>S<sub>n</sub></i> ya?</p>
  `;
  discussionFeed.appendChild(initialMsg);
}
seedDiscussion();

discFileInput.addEventListener('change', () => {
  if (discFileInput.files[0]) {
    discAttachPreview.hidden = false;
    discAttachPreview.textContent = `Lampiran siap dikirim: ${discFileInput.files[0].name}`;
  } else {
    discAttachPreview.hidden = true;
  }
});

discussionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const textVal = discussionInput.value.trim();
  const file = discFileInput.files[0];
  if (!textVal && !file) return;

  const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  let mediaHTML = '';

  if (file) {
    const fileUrl = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
      mediaHTML = `<div style="margin-top:8px;"><img src="${fileUrl}" style="max-width:240px; border-radius:10px; border:1px solid #cbd5e1;"></div>`;
    } else if (file.type.startsWith('audio/')) {
      mediaHTML = `<div style="margin-top:8px;"><audio controls src="${fileUrl}"></audio></div>`;
    } else {
      mediaHTML = `<div style="margin-top:8px;"><a href="${fileUrl}" download="${file.name}" class="chip-btn" style="text-decoration:none; display:inline-block;">Unduh Dokumen: ${file.name}</a></div>`;
    }
  }

  const itemDiv = document.createElement('div');
  itemDiv.className = 'discussion-item';
  const senderName = currentUser ? `${currentUser.name} (${currentUser.school || 'Siswa'})` : 'Siswa';

  itemDiv.innerHTML = `
    <div class="disc-header">
      <strong>${senderName}</strong>
      <span class="disc-time">Diposting pukul ${nowStr}</span>
    </div>
    <p class="disc-text">${textVal}</p>
    ${mediaHTML}
    <div style="text-align:right; margin-top:6px;">
      <button type="button" class="chip-btn edit-msg-btn">Edit Pesan</button>
    </div>
  `;

  const editBtn = itemDiv.querySelector('.edit-msg-btn');
  const textP = itemDiv.querySelector('.disc-text');
  const timeSpan = itemDiv.querySelector('.disc-time');

  editBtn.addEventListener('click', () => {
    const updated = prompt('Perbarui pesan diskusi Anda:', textP.textContent);
    if (updated !== null && updated.trim() !== '') {
      const editTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      textP.textContent = updated.trim();
      timeSpan.textContent = `Diposting pukul ${nowStr} · Diedit pukul ${editTime}`;
      playSoundEffect('click');
    }
  });

  discussionFeed.appendChild(itemDiv);
  discussionFeed.scrollTop = discussionFeed.scrollHeight;
  discussionInput.value = '';
  discFileInput.value = '';
  discAttachPreview.hidden = true;
  playSoundEffect('success');
});

// =========================================================================
// 10. BANK SOAL 3 KATEGORI (UTAMA 5, TAMBAHAN 5, TUGAS RUMAH/PR 5 = 15 SOAL)
// =========================================================================
const QUESTION_BANK = {
  utama: [
    {
      step: "LATIHAN UTAMA · SOAL 1 / 5",
      indicator: "Indikator Numerasi: Menentukan Suku ke-n pada Konteks Kapasitas",
      title: "Susunan Kursi Gedung Pertunjukan",
      problem: `<p>Sebuah gedung pertunjukan menyusun kursi penonton dengan aturan baris aritmetika. Baris pertama memuat <strong>12 kursi</strong>, baris kedua <strong>16 kursi</strong>, dan baris ketiga <strong>20 kursi</strong>. Berapakah banyak kursi pada <strong>baris ke-10</strong>?</p>`,
      unit: "kursi", expectedA: 12, expectedB: 4, expectedFormula: "Un", answer: 48, wrongTrap: 300,
      explaining: "Soal ini menanyakan jumlah kursi <strong>khusus pada baris ke-10 saja (<i>U</i><sub>10</sub>)</strong>, sehingga kita menggunakan rumus Barisan Aritmetika: <i>U<sub>n</sub></i> = <i>a</i> + (<i>n</i> − 1)<i>b</i>.",
      guiding: [
        "Tahap 1 (Memilah Data): Catat kursi baris pertama a = 12 dan urutan baris yang ditanya n = 10.",
        "Tahap 2 (Mengenali Pola): Selisih kursi antarbaris adalah b = 16 − 12 = 4 kursi.",
        "Tahap 3 (Memilih Rumus): Gunakan rumus suku ke-n: U₁₀ = a + 9b.",
        "Tahap 4 (Menyusun Perhitungan): U₁₀ = 12 + (9 × 4) = 12 + 36. Masukkan hasil akhirnya!"
      ],
      summary: "Dengan a = 12 dan b = 4, banyak kursi pada baris ke-10 adalah U₁₀ = 12 + 36 = 48 kursi."
    },
    {
      step: "LATIHAN UTAMA · SOAL 2 / 5",
      indicator: "Indikator Numerasi: Menganalisis Pola Aritmetika Menurun",
      title: "Evaluasi Waktu Tempuh Lari",
      problem: `<p>Seorang atlet lari mencatat waktu latihan setiap minggu. Minggu ke-1 ia membutuhkan waktu <strong>96 detik</strong>, minggu ke-2 menjadi <strong>90 detik</strong>, dan minggu ke-3 menjadi <strong>84 detik</strong>. Berapa detik catatan waktu atlet tersebut pada <strong>minggu ke-8</strong>?</p>`,
      unit: "detik", expectedA: 96, expectedB: -6, expectedFormula: "Un", answer: 54, wrongTrap: 138,
      explaining: "Karena waktu tempuh semakin berkurang secara tetap, maka permasalahan ini merupakan <strong>Barisan Aritmetika Menurun</strong> dengan nilai beda negatif (<i>b</i> &lt; 0).",
      guiding: [
        "Tahap 1 (Memilah Data): Waktu awal a = 96 detik dan target urutan minggu n = 8.",
        "Tahap 2 (Mengenali Pola): Dari 96 ke 90 berkurang 6 detik, maka beda b = −6.",
        "Tahap 3 (Memilih Rumus): Gunakan U₈ = a + 7b dengan memperhatikan tanda negatif.",
        "Tahap 4 (Menyusun Perhitungan): U₈ = 96 + (7 × (−6)) = 96 − 42. Ketik hasilnya!"
      ],
      summary: "Dengan a = 96 dan penurunan b = −6, catatan waktu pada minggu ke-8 adalah 54 detik."
    },
    {
      step: "LATIHAN UTAMA · SOAL 3 / 5",
      indicator: "Indikator Numerasi: Menghitung Akumulasi Deret (Sn)",
      title: "Total Produksi Kerajinan Siswa",
      problem: `<p>Kelompok wirausaha siswa memproduksi suvenir sekolah. Hari ke-1 selesai <strong>20 unit</strong>, hari ke-2 sebanyak <strong>30 unit</strong>, dan hari ke-3 sebanyak <strong>40 unit</strong>. Berapa <strong>jumlah total seluruh suvenir</strong> yang diproduksi selama <strong>6 hari pertama</strong>?</p>`,
      unit: "unit", expectedA: 20, expectedB: 10, expectedFormula: "Sn", answer: 270, wrongTrap: 70,
      explaining: "Karena yang ditanyakan adalah <strong>jumlah total selama 6 hari</strong>, kita harus mengakumulasikan suku ke-1 sampai ke-6 menggunakan rumus Deret Aritmetika: <i>S<sub>n</sub></i> = (<i>n</i>/2)(2<i>a</i> + (<i>n</i> − 1)<i>b</i>).",
      guiding: [
        "Tahap 1 (Memilah Data): Produksi hari pertama a = 20 unit dan lama produksi n = 6 hari.",
        "Tahap 2 (Mengenali Pola): Pertambahan produksi harian adalah b = 30 − 20 = 10 unit.",
        "Tahap 3 (Memilih Rumus): Gunakan rumus jumlah deret S₆ = (6/2) × (2a + 5b).",
        "Tahap 4 (Menyusun Perhitungan): S₆ = 3 × (40 + 50) = 3 × 90. Masukkan hasilnya!"
      ],
      summary: "Jumlah total produksi suvenir selama 6 hari pertama adalah S₆ = 270 unit."
    },
    {
      step: "LATIHAN UTAMA · SOAL 4 / 5",
      indicator: "Indikator Numerasi: Menentukan Suku dari Dua Suku Berjauhan",
      title: "Kenaikan Gaji Berkala Karyawan",
      problem: `<p>Seorang staf administrasi menerima kenaikan tunjangan tetap setiap tahun. Pada tahun ke-3 tunjangannya <strong>400 ribu rupiah</strong>, dan pada tahun ke-7 menjadi <strong>600 ribu rupiah</strong>. Berapakah tunjangan staf tersebut pada <strong>tahun pertama (<i>a</i>)</strong>?</p>`,
      unit: "ribu rupiah", expectedA: 300, expectedB: 50, expectedFormula: "Un", answer: 300, wrongTrap: 350,
      explaining: "Jika dua suku yang berjauhan diketahui (<i>U</i><sub>3</sub> dan <i>U</i><sub>7</sub>), kita dapat mencari beda dengan rumus <i>b</i> = (<i>U</i><sub>7</sub> − <i>U</i><sub>3</sub>) / (7 − 3), lalu mensubstitusikannya untuk memperoleh suku pertama (<i>a</i>).",
      guiding: [
        "Tahap 1 (Memilah Data): Diketahui U₃ = 400 dan U₇ = 600.",
        "Tahap 2 (Mengenali Pola Selisih): Hitung beda b = (600 − 400) / (7 − 3) = 200 / 4 = 50.",
        "Tahap 3 (Memilih Rumus): Gunakan persamaan U₃ = a + 2b = 400.",
        "Tahap 4 (Menyusun Perhitungan): a = 400 − 2(50) = 400 − 100. Masukkan nilai a!"
      ],
      summary: "Beda kenaikan tahunan b = 50 ribu, sehingga tunjangan tahun pertama adalah a = 300 ribu rupiah."
    },
    {
      step: "LATIHAN UTAMA · SOAL 5 / 5",
      indicator: "Indikator Numerasi: Evaluasi Kecukupan Target Finansial",
      title: "Evaluasi Target Dana Kegiatan Amal",
      problem: `<p>OSIS mengumpulkan donasi selama <strong>5 hari</strong>. Hari pertama terkumpul <strong>100 ribu rupiah</strong>, hari kedua <strong>150 ribu rupiah</strong>, dan terus bertambah 50 ribu setiap harinya. Jika target donasi adalah <strong>1.200 ribu rupiah</strong>, berapa <strong>kekurangan dana</strong> setelah hari ke-5?</p>`,
      unit: "ribu rupiah", expectedA: 100, expectedB: 50, expectedFormula: "Evaluasi", answer: 200, wrongTrap: 1000,
      explaining: "Soal ini menuntut evaluasi dua langkah: pertama menghitung total donasi 5 hari menggunakan rumus deret (<i>S</i><sub>5</sub>), kemudian menghitung selisihnya terhadap target 1.200 ribu rupiah.",
      guiding: [
        "Tahap 1 (Memilah Data): Donasi awal a = 100, durasi n = 5 hari, dan target = 1.200.",
        "Tahap 2 (Mengenali Pola): Pertambahan harian b = 50.",
        "Tahap 3 (Memilih Strategi): Hitung S₅ = (5/2)(2a + 4b), lalu kurangkan 1.200 dengan S₅.",
        "Tahap 4 (Menyusun Perhitungan): S₅ = (5/2)(200 + 200) = 1.000. Kekurangan = 1.200 − 1.000!"
      ],
      summary: "Total donasi 5 hari S₅ = 1.000 ribu rupiah, sehingga masih kurang 200 ribu rupiah dari target."
    }
  ],
  tambahan: [
    {
      step: "LATIHAN TAMBAHAN · SOAL 1 / 5",
      indicator: "Indikator Numerasi: Aplikasi Barisan pada Transportasi",
      title: "Tarif Argo Taksi Kota",
      problem: `<p>Sebuah armada taksi menetapkan tarif kilometer ke-1 sebesar <strong>15 ribu rupiah</strong>, kilometer ke-2 menjadi <strong>19 ribu rupiah</strong>, dan kilometer ke-3 menjadi <strong>23 ribu rupiah</strong>. Berapa tarif pada <strong>kilometer ke-12</strong>?</p>`,
      unit: "ribu rupiah", expectedA: 15, expectedB: 4, expectedFormula: "Un", answer: 59, wrongTrap: 444,
      explaining: "Tarif pada kilometer ke-12 merupakan nilai suku tunggal pada urutan ke-12 (<i>U</i><sub>12</sub>).",
      guiding: [
        "Tahap 1: Tarif awal a = 15 dan jarak urutan n = 12.",
        "Tahap 2: Kenaikan tarif per km adalah b = 19 − 15 = 4.",
        "Tahap 3: Gunakan rumus U₁₂ = a + 11b.",
        "Tahap 4: Hitung 15 + (11 × 4) = 15 + 44!"
      ],
      summary: "Tarif pada kilometer ke-12 adalah U₁₂ = 15 + 44 = 59 ribu rupiah."
    },
    {
      step: "LATIHAN TAMBAHAN · SOAL 2 / 5",
      indicator: "Indikator Numerasi: Akumulasi Jarak Tempuh Bersepeda",
      title: "Program Latihan Bersepeda",
      problem: `<p>Reno berlatih sepeda selama <strong>7 hari</strong>. Hari pertama ia menempuh <strong>8 km</strong>, hari kedua <strong>11 km</strong>, dan hari ketiga <strong>14 km</strong>. Berapa <strong>total seluruh jarak</strong> yang ditempuh Reno selama 7 hari tersebut?</p>`,
      unit: "km", expectedA: 8, expectedB: 3, expectedFormula: "Sn", answer: 119, wrongTrap: 26,
      explaining: "Menanyakan total jarak selama 7 hari berarti menjumlahkan jarak hari ke-1 hingga ke-7 dengan rumus deret <i>S</i><sub>7</sub>.",
      guiding: [
        "Tahap 1: Jarak hari pertama a = 8 km dan n = 7 hari.",
        "Tahap 2: Pertambahan jarak per hari b = 3 km.",
        "Tahap 3: Gunakan S₇ = (7/2) × (2a + 6b).",
        "Tahap 4: S₇ = (7/2) × (16 + 18) = (7/2) × 34!"
      ],
      summary: "Total jarak bersepeda selama 7 hari adalah S₇ = 119 km."
    },
    {
      step: "LATIHAN TAMBAHAN · SOAL 3 / 5",
      indicator: "Indikator Numerasi: Aplikasi Suku Tengah",
      title: "Barisan Bendera Upacara",
      problem: `<p>Panitia menyusun <strong>9 tiang bendera</strong> dengan tinggi yang membentuk barisan aritmetika. Tiang paling pendek (ke-1) tingginya <strong>120 cm</strong> dan tiang paling tinggi (ke-9) adalah <strong>240 cm</strong>. Berapa tinggi tiang yang berada <strong>tepat di posisi tengah (tiang ke-5)</strong>?</p>`,
      unit: "cm", expectedA: 120, expectedB: 15, expectedFormula: "Un", answer: 180, wrongTrap: 160,
      explaining: "Suku tengah (<i>U<sub>t</sub></i>) dari barisan ganjil dapat dihitung langsung dari rata-rata suku awal dan suku terakhir: <i>U<sub>t</sub></i> = (<i>a</i> + <i>U<sub>n</sub></i>) / 2.",
      guiding: [
        "Tahap 1: Diketahui suku awal a = 120 cm dan suku terakhir U₉ = 240 cm.",
        "Tahap 2: Posisi tengah adalah tiang ke-5.",
        "Tahap 3: Gunakan rumus suku tengah Ut = (a + U₉) / 2.",
        "Tahap 4: Hitung (120 + 240) / 2!"
      ],
      summary: "Tinggi tiang di posisi tengah adalah (120 + 240) / 2 = 180 cm."
    },
    {
      step: "LATIHAN TAMBAHAN · SOAL 4 / 5",
      indicator: "Indikator Numerasi: Analisis Penurunan Suhu Pendingin",
      title: "Pendinginan Bahan Laboratorium",
      problem: `<p>Sebuah sampel kimia bersuhu awal <strong>25 derajat</strong> dimasukkan ke lemari pendingin. Setiap menit suhunya turun secara tetap sebesar <strong>4 derajat</strong> (menit ke-1 = 25, menit ke-2 = 21, dst). Berapa derajat suhu sampel pada <strong>menit ke-9</strong>?</p>`,
      unit: "derajat", expectedA: 25, expectedB: -4, expectedFormula: "Un", answer: -7, wrongTrap: 57,
      explaining: "Karena suhu turun 4 derajat tiap menit, beda bernilai negatif (<i>b</i> = −4) sehingga suhu dapat melewati angka nol (menjadi negatif).",
      guiding: [
        "Tahap 1: Suhu menit pertama a = 25 dan urutan waktu n = 9.",
        "Tahap 2: Penurunan suhu b = −4.",
        "Tahap 3: Gunakan U₉ = a + 8b.",
        "Tahap 4: Hitung 25 + (8 × (−4)) = 25 − 32!"
      ],
      summary: "Pada menit ke-9, suhu sampel turun menjadi 25 − 32 = −7 derajat."
    },
    {
      step: "LATIHAN TAMBAHAN · SOAL 5 / 5",
      indicator: "Indikator Numerasi: Evaluasi Target Penjualan Buku",
      title: "Target Bazar Buku Literasi",
      problem: `<p>Stand literasi sekolah menjual <strong>30 buku</strong> pada hari ke-1, <strong>40 buku</strong> pada hari ke-2, dan terus naik 10 buku per hari selama <strong>6 hari pameran</strong>. Jika stok buku yang dibawa adalah <strong>400 buku</strong>, berapa buku yang <strong>tersisa (belum terjual)</strong> di akhir pameran?</p>`,
      unit: "buku", expectedA: 30, expectedB: 10, expectedFormula: "Evaluasi", answer: 70, wrongTrap: 330,
      explaining: "Kita perlu menghitung total buku terjual selama 6 hari (<i>S</i><sub>6</sub>), lalu mengurangkannya dari total stok 400 buku.",
      guiding: [
        "Tahap 1: Penjualan awal a = 30, n = 6 hari, stok = 400.",
        "Tahap 2: Kenaikan harian b = 10 buku.",
        "Tahap 3: Hitung S₆ = 3 × (2(30) + 5(10)), lalu kurangkan 400 dengan S₆.",
        "Tahap 4: S₆ = 3 × 110 = 330 buku. Maka sisa stok = 400 − 330!"
      ],
      summary: "Total terjual S₆ = 330 buku, sehingga buku yang tersisa adalah 400 − 330 = 70 buku."
    }
  ],
  pr: [
    {
      step: "TUGAS / PR RUMAH · SOAL 1 / 5",
      indicator: "Indikator Numerasi: Penjadwalan Cicilan Tanpa Bunga",
      title: "Skema Pembayaran Sepeda Listrik",
      problem: `<p>Pak Arman melunasi sepeda listrik selama <strong>10 bulan</strong>. Bulan ke-1 ia membayar <strong>800 ribu rupiah</strong>, bulan ke-2 sebesar <strong>750 ribu rupiah</strong>, dan terus berkurang 50 ribu setiap bulan. Berapa nominal angsuran pada <strong>bulan ke-10</strong>?</p>`,
      unit: "ribu rupiah", expectedA: 800, expectedB: -50, expectedFormula: "Un", answer: 350, wrongTrap: 1250,
      explaining: "Angsuran menurun secara tetap sebesar 50 ribu per bulan (<i>b</i> = −50). Kita mencari suku ke-10 (<i>U</i><sub>10</sub>).",
      guiding: [
        "Tahap 1: Angsuran pertama a = 800 dan urutan bulan n = 10.",
        "Tahap 2: Karena berkurang, maka b = −50.",
        "Tahap 3: Gunakan U₁₀ = a + 9b.",
        "Tahap 4: Hitung 800 + (9 × (−50)) = 800 − 450!"
      ],
      summary: "Nominal angsuran pada bulan ke-10 adalah 800 − 450 = 350 ribu rupiah."
    },
    {
      step: "TUGAS / PR RUMAH · SOAL 2 / 5",
      indicator: "Indikator Numerasi: Akumulasi Total Harga Cicilan",
      title: "Total Pelunasan Sepeda Listrik",
      problem: `<p>Berdasarkan data soal nomor 1 di atas (bulan pertama <strong>800 ribu</strong>, berkurang <strong>50 ribu</strong> tiap bulan selama <strong>10 bulan</strong>), berapakah <strong>harga total sepeda listrik</strong> yang dilunasi Pak Arman seluruhnya (<i>S</i><sub>10</sub>)?</p>`,
      unit: "ribu rupiah", expectedA: 800, expectedB: -50, expectedFormula: "Sn", answer: 5750, wrongTrap: 350,
      explaining: "Harga total sepeda listrik sama dengan akumulasi seluruh angsuran dari bulan ke-1 hingga bulan ke-10 (<i>S</i><sub>10</sub>).",
      guiding: [
        "Tahap 1: Diketahui a = 800, U₁₀ = 350, dan n = 10.",
        "Tahap 2: Pola beda tetap b = −50.",
        "Tahap 3: Gunakan S₁₀ = (10 / 2) × (a + U₁₀).",
        "Tahap 4: Hitung 5 × (800 + 350) = 5 × 1.150!"
      ],
      summary: "Total harga sepeda listrik tersebut adalah S₁₀ = 5 × 1.150 = 5.750 ribu rupiah."
    },
    {
      step: "TUGAS / PR RUMAH · SOAL 3 / 5",
      indicator: "Indikator Numerasi: Penerapan Konsep Sisipan",
      title: "Penambahan Tiang Lampu Jalan",
      problem: `<p>Dua tiang lampu utama berjarak <strong>48 meter</strong>. Untuk meningkatkan penerangan, di antara kedua tiang tersebut dipasang <strong>5 tiang lampu tambahan</strong> dengan jarak antar-tiang yang sama. Berapa meter <strong>jarak antar-tiang (beda baru <i>b'</i>)</strong> sekarang?</p>`,
      unit: "meter", expectedA: 0, expectedB: 8, expectedFormula: "Un", answer: 8, wrongTrap: 9,
      explaining: "Menyisipkan <i>k</i> = 5 tiang di antara jarak awal <i>b</i> = 48 meter menggunakan rumus sisipan: <i>b'</i> = <i>b</i> / (<i>k</i> + 1).",
      guiding: [
        "Tahap 1: Selisih jarak awal b = 48 meter.",
        "Tahap 2: Banyak tiang yang disisipkan k = 5.",
        "Tahap 3: Gunakan rumus beda sisipan b' = b / (k + 1).",
        "Tahap 4: Hitung 48 / (5 + 1) = 48 / 6!"
      ],
      summary: "Jarak antar-tiang lampu setelah disisipkan 5 tiang baru adalah 48 / 6 = 8 meter."
    },
    {
      step: "TUGAS / PR RUMAH · SOAL 4 / 5",
      indicator: "Indikator Numerasi: Menganalisis Suku dari Rumus Deret",
      title: "Analisis Pertumbuhan Anggota Klub Sains",
      problem: `<p>Jumlah seluruh anggota baru Klub Sains hingga bulan ke-4 (<i>S</i><sub>4</sub>) adalah <strong>85 orang</strong>, sedangkan jumlah seluruh anggota hingga bulan ke-5 (<i>S</i><sub>5</sub>) mencapai <strong>115 orang</strong>. Berapa banyak anggota yang bergabung <strong>khusus pada bulan ke-5 saja (<i>U</i><sub>5</sub>)</strong>?</p>`,
      unit: "orang", expectedA: 10, expectedB: 5, expectedFormula: "Un", answer: 30, wrongTrap: 200,
      explaining: "Gunakan hubungan antara suku ke-<i>n</i> dan deret: <i>U</i><sub>5</sub> = <i>S</i><sub>5</sub> − <i>S</i><sub>4</sub>.",
      guiding: [
        "Tahap 1: Diketahui total hingga bulan ke-5 (S₅ = 115) dan hingga bulan ke-4 (S₄ = 85).",
        "Tahap 2: Penambahan khusus bulan ke-5 adalah selisih keduanya.",
        "Tahap 3: Gunakan rumus U₅ = S₅ − S₄.",
        "Tahap 4: Hitung 115 − 85!"
      ],
      summary: "Banyak anggota yang bergabung khusus pada bulan ke-5 adalah U₅ = 115 − 85 = 30 orang."
    },
    {
      step: "TUGAS / PR RUMAH · SOAL 5 / 5",
      indicator: "Indikator Numerasi: Pengambilan Keputusan Dua Skema",
      title: "Perbandingan Skema Bonus Penjualan",
      problem: `<p>Toko A memberikan total bonus 5 hari sebesar <strong>600 ribu rupiah</strong>. Di Toko B, bonus hari pertama <strong>60 ribu</strong>, hari kedua <strong>90 ribu</strong>, dan terus naik 30 ribu per hari selama <strong>5 hari</strong>. Berapa <strong>selisih total bonus</strong> antara Toko B dan Toko A selama 5 hari tersebut?</p>`,
      unit: "ribu rupiah", expectedA: 60, expectedB: 30, expectedFormula: "Evaluasi", answer: 0, wrongTrap: 600,
      explaining: "Hitung terlebih dahulu total bonus Toko B selama 5 hari (<i>S</i><sub>5</sub>), lalu bandingkan selisihnya dengan Toko A (600 ribu).",
      guiding: [
        "Tahap 1: Di Toko B, a = 60, b = 30, dan n = 5 hari.",
        "Tahap 2: Hitung total Toko B: S₅ = (5/2) × (2(60) + 4(30)).",
        "Tahap 3: S₅ Toko B = (5/2) × (120 + 120) = 600 ribu.",
        "Tahap 4: Bandingkan Toko B (600) dengan Toko A (600). Selisihnya adalah 600 − 600!"
      ],
      summary: "Total bonus Toko B selama 5 hari juga 600 ribu rupiah, sehingga selisih kedua toko adalah 0 ribu rupiah (sama besar)."
    }
  ]
};

let currentCategory = 'utama';
let curPracticeIdx = 0;
let guideStepPointer = 0;
let lastStudentAttempt = null;
const chatMessages = document.getElementById('chat-messages');

function appendZetaMessage(roleType, contentHTML, isUser = false) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`;

  if (isUser) {
    div.textContent = contentHTML;
  } else {
    let badgeHTML = '';
    if (roleType === 'explain') {
      badgeHTML = `<span class="role-tag role-explain">Explaining · Penjelasan Konsep</span><br>`;
    } else if (roleType === 'guide') {
      badgeHTML = `<span class="role-tag role-guide">Guiding · Tuntunan Bertahap</span><br>`;
    } else if (roleType === 'feedback') {
      badgeHTML = `<span class="role-tag role-feedback">Providing Feedback · Evaluasi Jawaban</span><br>`;
    }
    div.innerHTML = `${badgeHTML}${contentHTML}`;
  }

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function loadPracticeQuestion(idx) {
  curPracticeIdx = idx;
  guideStepPointer = 0;
  lastStudentAttempt = null;

  const list = QUESTION_BANK[currentCategory];
  const q = list[idx];

  document.getElementById('practice-step-badge').textContent = q.step;
  document.getElementById('practice-indicator-badge').textContent = q.indicator;
  document.getElementById('challenge-title').textContent = q.title;
  document.getElementById('challenge-problem').innerHTML = q.problem;
  document.getElementById('challenge-unit').textContent = q.unit;

  document.getElementById('step-a-input').value = '';
  document.getElementById('step-b-input').value = '';
  document.getElementById('step-formula-select').value = '';
  document.getElementById('answer-input').value = '';
  document.getElementById('feedback-box').hidden = true;
  document.getElementById('next-btn').hidden = true;

  chatMessages.innerHTML = '';
  appendZetaMessage(
    'explain',
    `Halo! Aku <strong>ZETA</strong>. Kita sedang mengerjakan <strong>${q.title}</strong>.<br>Klik salah satu dari 3 tombol peran di atas jika kamu butuh <strong>Penjelasan Konsep</strong>, <strong>Bimbingan Langkah</strong>, atau <strong>Evaluasi Jawaban</strong>.`
  );
}

// Perpindahan Tab Kategori Latihan (Utama, Tambahan, Tugas/PR)
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

// Tiga Peran Eksplisit ZETA AI
function triggerZetaExplaining() {
  aiHelpCounter++;
  const q = QUESTION_BANK[currentCategory][curPracticeIdx];
  appendZetaMessage('explain', q.explaining);
  recordLog(`ZETA [Explaining] - ${q.title}`, 'Meminta penjelasan konsep', 'Dibimbing AI');
  playSoundEffect('click');
}

function triggerZetaGuiding() {
  aiHelpCounter++;
  const q = QUESTION_BANK[currentCategory][curPracticeIdx];
  const stepText = q.guiding[guideStepPointer];
  appendZetaMessage('guide', `<strong>${stepText}</strong>`);
  recordLog(`ZETA [Guiding Tahap ${guideStepPointer + 1}] - ${q.title}`, `Tahap CT ${guideStepPointer + 1}`, 'Dibimbing AI');
  guideStepPointer = (guideStepPointer + 1) % q.guiding.length;
  playSoundEffect('click');
}

function buildDiagnosticFeedback(userVal) {
  const q = QUESTION_BANK[currentCategory][curPracticeIdx];
  const inpA = document.getElementById('step-a-input').value.trim();
  const inpB = document.getElementById('step-b-input').value.trim();
  const inpForm = document.getElementById('step-formula-select').value;
  const notes = [];

  if (inpA !== '' && Number(inpA) !== q.expectedA) {
    notes.push(`• Nilai awal (<i>a</i>) yang kamu isi (${inpA}) belum sesuai, seharusnya <strong>${q.expectedA}</strong>.`);
  }
  if (inpB !== '' && Number(inpB) !== q.expectedB) {
    notes.push(`• Selisih/beda (<i>b</i>) yang kamu isi (${inpB}) kurang tepat, perhatikan apakah polanya naik atau turun: seharusnya <strong>${q.expectedB}</strong>.`);
  }
  if (inpForm !== '' && inpForm !== q.expectedFormula) {
    notes.push(`• Pilihan model rumusmu belum tepat untuk pertanyaan ini.`);
  }
  if (userVal === q.wrongTrap) {
    notes.push(`• Jawaban <strong>${userVal}</strong> menunjukkan miskonsepsi umum: periksa apakah kamu tertukar antara menghitung suku ke-<i>n</i> (<i>U<sub>n</sub></i>) dan total deret (<i>S<sub>n</sub></i>), atau belum menghitung selisih akhirnya.`);
  }
  if (notes.length === 0) {
    notes.push(`• Jawaban akhir (<strong>${userVal !== null ? userVal : 'kosong'}</strong>) belum tepat. Mari cek kembali langkah substitusi angkanya.`);
  }

  return `Evaluasi Diagnostik ZETA untuk <strong>${q.title}</strong>:<br>${notes.join('<br>')}`;
}

function triggerZetaFeedback() {
  aiHelpCounter++;
  const valStr = document.getElementById('answer-input').value.trim();
  const numVal = valStr !== '' ? Number(valStr) : lastStudentAttempt;
  const q = QUESTION_BANK[currentCategory][curPracticeIdx];

  if (numVal === q.answer) {
    appendZetaMessage('feedback', `Jawabanmu (<strong>${numVal} ${q.unit}</strong>) sudah tepat! ${q.summary}`);
  } else {
    appendZetaMessage('feedback', buildDiagnosticFeedback(numVal));
  }
  recordLog(`ZETA [Feedback] - ${q.title}`, `Evaluasi nilai: ${numVal}`, 'Dibimbing AI');
  playSoundEffect('click');
}

document.getElementById('btn-role-explain').addEventListener('click', triggerZetaExplaining);
document.getElementById('btn-role-guide').addEventListener('click', triggerZetaGuiding);
document.getElementById('guide-me-btn').addEventListener('click', triggerZetaGuiding);
document.getElementById('btn-role-feedback').addEventListener('click', triggerZetaFeedback);

document.getElementById('check-btn').addEventListener('click', () => {
  const valStr = document.getElementById('answer-input').value.trim();
  if (valStr === '') {
    alert('Masukkan angka jawaban akhir terlebih dahulu.');
    return;
  }
  attemptCounter++;
  const val = Number(valStr);
  const list = QUESTION_BANK[currentCategory];
  const q = list[curPracticeIdx];
  const fb = document.getElementById('feedback-box');
  fb.hidden = false;

  if (val === q.answer) {
    fb.className = 'feedback correct';
    fb.innerHTML = `<strong>Jawaban Tepat (${q.answer} ${q.unit})!</strong><br>${q.summary}`;
    appendZetaMessage('feedback', `Tepat sekali! Jawabanmu <strong>${val} ${q.unit}</strong> benar. Kamu dapat melanjutkan ke soal berikutnya.`);

    const nextBtn = document.getElementById('next-btn');
    nextBtn.hidden = false;
    nextBtn.textContent = (curPracticeIdx === list.length - 1) ? 'Selesai & Lihat Rapor Evaluasi' : 'Soal Berikutnya &rarr;';
    playSoundEffect('success');
    recordLog(`${currentCategory.toUpperCase()} - ${q.title}`, val, 'Tuntas');
  } else {
    lastStudentAttempt = val;
    const diag = buildDiagnosticFeedback(val);
    fb.className = 'feedback try-again';
    fb.innerHTML = `<strong>Jawaban ${val} ${q.unit} belum tepat.</strong><br>Baca evaluasi dari ZETA di panel sebelah kanan untuk memperbaiki jawabanmu sebelum melangkah ke soal berikutnya.`;
    appendZetaMessage('feedback', diag);
    playSoundEffect('shock');
    recordLog(`${currentCategory.toUpperCase()} - ${q.title}`, val, 'Perlu Perbaikan');
  }
});

document.getElementById('next-btn').addEventListener('click', () => {
  const list = QUESTION_BANK[currentCategory];
  if (curPracticeIdx < list.length - 1) {
    loadPracticeQuestion(curPracticeIdx + 1);
    playSoundEffect('click');
  } else {
    finishCategoryAndShowReport();
  }
});

// Chat Ketik Bebas ke ZETA
document.querySelectorAll('.chip-btn[data-prompt]').forEach(btn => {
  btn.addEventListener('click', () => {
    const p = btn.getAttribute('data-prompt');
    appendZetaMessage('', p, true);
    setTimeout(() => {
      if (p.toLowerCase().includes('konsep')) triggerZetaExplaining();
      else if (p.toLowerCase().includes('salah')) triggerZetaFeedback();
      else triggerZetaGuiding();
    }, 300);
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
    const low = val.toLowerCase();
    if (low.includes('konsep') || low.includes('jelaskan')) triggerZetaExplaining();
    else if (low.includes('salah') || low.includes('kenapa')) triggerZetaFeedback();
    else triggerZetaGuiding();
  }, 300);
});

// =========================================================================
// 11. RAPOR PDF (BERBEDA TAMPILAN SISWA VS PENELITI/GURU) & LEADERBOARD
// =========================================================================
function finishCategoryAndShowReport() {
  isPracticeFinished = true;
  stopPracticeTimer();
  document.getElementById('practice-workspace').hidden = true;
  const repCard = document.getElementById('final-report-card');
  repCard.hidden = false;

  const isResearcher = currentUser && currentUser.role === 'admin';
  document.getElementById('report-role-badge').textContent = isResearcher
    ? 'LAPORAN ANALITIK PENELITI & GURU'
    : 'LAPORAN HASIL BELAJAR INDIVIDU SISWA';
  document.getElementById('report-main-title').textContent = isResearcher
    ? 'Rekapitulasi Diagnostik Kemampuan Numerasi & Tahap CT'
    : 'Rapor Capaian Kemampuan Numerasi Siswa';

  const catTitles = { utama: 'Latihan Utama (5 Soal)', tambahan: 'Latihan Tambahan (5 Soal)', pr: 'Tugas / PR Rumah (5 Soal)' };
  document.getElementById('rep-name').textContent = currentUser ? currentUser.name : 'Siswa';
  document.getElementById('rep-school').textContent = currentUser ? (currentUser.school || 'SMA') : '-';
  document.getElementById('rep-category').textContent = catTitles[currentCategory];
  document.getElementById('rep-time').textContent = document.getElementById('test-timer').textContent;

  const researcherBox = document.getElementById('researcher-only-report-section');
  if (isResearcher) {
    researcherBox.hidden = false;
    document.getElementById('researcher-diagnostic-table').innerHTML = `
      <table class="case-table">
        <thead>
          <tr><th>Total Percobaan Menjawab</th><th>Frekuensi Interaksi ZETA AI</th><th>Klasifikasi Ketuntasan</th><th>Kesiapan Post-Test</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>${attemptCounter} Percobaan</td>
            <td>${aiHelpCounter} Kali Scaffolding</td>
            <td>Tuntas Terbimbing (Mastery 100%)</td>
            <td>Sangat Siap</td>
          </tr>
        </tbody>
      </table>
    `;
  } else {
    researcherBox.hidden = true;
  }

  const list = QUESTION_BANK[currentCategory];
  document.getElementById('report-details-list').innerHTML = list.map((q, i) => `
    <div style="background:#f8fafc; padding:14px; border-radius:10px; border:1px solid #dbe3ef; margin-top:10px;">
      <strong>${i + 1}. ${q.title} (${q.indicator})</strong>
      <p style="font-size:13.5px; color:#047857; font-weight:600; margin:4px 0;">Status: Tuntas · Jawaban Benar: ${q.answer} ${q.unit}</p>
      <p style="font-size:13px; color:#475569;">Pembahasan: ${q.summary}</p>
    </div>
  `).join('');

  saveToLeaderboard();
  playSoundEffect('success');
}

document.getElementById('back-to-practice-btn').addEventListener('click', () => {
  document.getElementById('practice-workspace').hidden = false;
  document.getElementById('final-report-card').hidden = true;
});

document.getElementById('print-report-btn').addEventListener('click', () => {
  window.print();
});

// Sistem Peringkat (Leaderboard 3 Terbesar) & Share WA / IG / Copy Link
const defaultLeaders = [
  { name: "Mumu", school: "SMA Negeri 1 Palembang", score: 100, time: "02:15", univ: "ITB" },
  { name: "Alya Putri", school: "SMA Negeri Sumatera Selatan", score: 100, time: "02:40", univ: "UGM" },
  { name: "Raka Pratama", school: "SMA Negeri 1 Palembang", score: 100, time: "03:05", univ: "UNSRI" }
];

function saveToLeaderboard() {
  if (!currentUser) return;
  const stored = JSON.parse(localStorage.getItem('ANORA_LEADERBOARD') || JSON.stringify(defaultLeaders));
  const timeStr = document.getElementById('test-timer').textContent;
  const existingIdx = stored.findIndex(item => item.name.toLowerCase() === currentUser.name.toLowerCase());
  const entry = {
    name: currentUser.name,
    school: currentUser.school || 'SMA',
    score: 100,
    time: timeStr,
    univ: currentUser.univ || 'Kampus Impian'
  };
  if (existingIdx >= 0) stored[existingIdx] = entry;
  else stored.unshift(entry);
  localStorage.setItem('ANORA_LEADERBOARD', JSON.stringify(stored.slice(0, 5)));
  renderLeaderboard();
}

function renderLeaderboard() {
  const stored = JSON.parse(localStorage.getItem('ANORA_LEADERBOARD') || JSON.stringify(defaultLeaders));
  const podium = document.getElementById('leaderboard-podium');
  podium.innerHTML = stored.slice(0, 3).map((u, idx) => `
    <div class="rank-card ${idx === 0 ? 'rank-1' : ''}">
      <div class="rank-badge">#${idx + 1}</div>
      <div>
        <strong style="font-size:15px;">${u.name}</strong>
        <p style="font-size:12px; color:var(--text-muted);">${u.school} · Target: ${u.univ}</p>
        <span style="font-size:12.5px; font-weight:700; color:var(--primary);">Skor: ${u.score} | Waktu: ${u.time}</span>
      </div>
    </div>
  `).join('');
}

function getShareMessage() {
  const uName = currentUser ? currentUser.name : 'Siswa';
  const uSchool = currentUser ? (currentUser.school || 'SMA') : 'SMA';
  return `Saya (${uName} - ${uSchool}) telah menuntaskan tantangan Kemampuan Numerasi Barisan & Deret Aritmetika di platform ANORA dengan Skor 100! Mari uji penalaranmu di: ${window.location.href}`;
}

document.getElementById('share-wa-btn').addEventListener('click', () => {
  const url = `https://wa.me/?text=${encodeURIComponent(getShareMessage())}`;
  window.open(url, '_blank');
});

document.getElementById('share-ig-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(getShareMessage());
  alert('Teks pencapaian telah disalin! Membuka Instagram agar kamu dapat menempelkannya di Story atau Bio.');
  window.open('https://instagram.com', '_blank');
});

document.getElementById('copy-link-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(getShareMessage());
  alert('Tautan dan pesan pencapaian berhasil disalin ke papan klip!');
  playSoundEffect('success');
});

loadPracticeQuestion(0);

// =========================================================================
// 12. PROFIL SISWA (GESER/PUTAR FOTO, WAJIB ISI SEMUA, SHOWCASE & DIREKTORI)
// =========================================================================
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

profHobbySelect.addEventListener('change', () => {
  customHobbyField.hidden = (profHobbySelect.value !== 'Lainnya');
});

function getTransformStyleString() {
  const scale = Number(photoZoom.value) / 100;
  const rot = Number(photoRotate.value);
  const tx = Number(photoPosX.value);
  const ty = Number(photoPosY.value);
  return `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rot}deg)`;
}

function applyPhotoStyle() {
  const img = avatarPreview.querySelector('img');
  if (!img) return;
  img.style.transform = getTransformStyleString();
  img.style.filter = photoFilter.value;
}

[photoZoom, photoRotate, photoPosX, photoPosY, photoFilter].forEach(el => {
  el.addEventListener('input', applyPhotoStyle);
});

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
  const saved = JSON.parse(localStorage.getItem(`ANORA_PROFILE_${uid}`) || 'null');
  const data = saved || currentUser;

  profName.value = data.name || '';
  profSchool.value = data.school || '';
  profGender.value = data.gender || 'Laki-laki';
  profUniv.value = data.univ || '';
  profIg.value = data.ig || '';

  const standardHobbies = Array.from(profHobbySelect.options).map(o => o.value);
  if (data.hobby && standardHobbies.includes(data.hobby)) {
    profHobbySelect.value = data.hobby;
    customHobbyField.hidden = true;
  } else if (data.hobby) {
    profHobbySelect.value = 'Lainnya';
    customHobbyField.hidden = false;
    profHobbyCustom.value = data.hobby;
  }

  const savedImg = localStorage.getItem(`ANORA_AVATAR_${uid}`);
  if (savedImg) {
    avatarPreview.innerHTML = `<img src="${savedImg}" alt="Foto Profil">`;
    applyPhotoStyle();
  }

  applyGenderTheme(profGender.value);

  if (saved && saved.isComplete) {
    renderSavedProfileView(saved, savedImg);
  } else {
    profileViewMode.hidden = true;
    profileEditMode.hidden = false;
  }
}

function renderSavedProfileView(data, imgSrc) {
  profileEditMode.hidden = true;
  profileViewMode.hidden = false;
  applyGenderTheme(data.gender);

  const viewAvatar = document.getElementById('view-avatar-box');
  if (imgSrc) {
    viewAvatar.innerHTML = `<img src="${imgSrc}" style="transform:${data.transform || 'none'}; filter:${data.filter || 'none'};" alt="Avatar">`;
  } else {
    viewAvatar.textContent = data.name.charAt(0).toUpperCase();
  }

  document.getElementById('view-prof-name').textContent = data.name;
  document.getElementById('view-prof-school').textContent = data.school;
  document.getElementById('view-prof-gender').textContent = data.gender;
  document.getElementById('view-prof-hobby').textContent = `Hobi: ${data.hobby}`;
  document.getElementById('view-prof-univ').textContent = `Kampus Impian: ${data.univ}`;

  const igLink = document.getElementById('view-prof-ig');
  const cleanIg = data.ig.startsWith('http') ? data.ig : `https://instagram.com/${data.ig.replace(/^@/, '')}`;
  igLink.href = cleanIg;
}

document.getElementById('edit-profile-trigger-btn').addEventListener('click', () => {
  profileViewMode.hidden = true;
  profileEditMode.hidden = false;
  playSoundEffect('click');
});

document.getElementById('avatar-file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file || !currentUser) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const b64 = ev.target.result;
    localStorage.setItem(`ANORA_AVATAR_${currentUser.id}`, b64);
    avatarPreview.innerHTML = `<img src="${b64}" alt="Foto Profil">`;
    applyPhotoStyle();
    playSoundEffect('success');
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
    playSoundEffect('shock');
    return;
  }

  valMsg.hidden = true;
  const uid = currentUser.id;
  const profileObj = {
    id: uid,
    name: nameVal,
    school: schoolVal,
    gender: genderVal,
    hobby: hobbyVal,
    univ: univVal,
    ig: igVal,
    role: currentUser.role,
    transform: getTransformStyleString(),
    filter: photoFilter.value,
    isComplete: true
  };

  localStorage.setItem(`ANORA_PROFILE_${uid}`, JSON.stringify(profileObj));
  localStorage.setItem('ANORA_ACTIVE_USER', JSON.stringify(profileObj));
  currentUser = profileObj;

  // Simpan ke direktori kelas
  const dirList = JSON.parse(localStorage.getItem('ANORA_CLASS_DIRECTORY') || '[]');
  const existIdx = dirList.findIndex(d => d.id === uid);
  if (existIdx >= 0) dirList[existIdx] = profileObj;
  else dirList.unshift(profileObj);
  localStorage.setItem('ANORA_CLASS_DIRECTORY', JSON.stringify(dirList));

  const savedImg = localStorage.getItem(`ANORA_AVATAR_${uid}`);
  renderSavedProfileView(profileObj, savedImg);
  renderClassmatesDirectory();
  playSoundEffect('success');
});

function renderClassmatesDirectory() {
  const defaultPeers = [
    { id: "mumu", name: "Mumu", school: "SMA Negeri 1 Palembang", gender: "Laki-laki", hobby: "Bulu Tangkis", univ: "Institut Teknologi Bandung", ig: "@mumu.student" },
    { id: "miwa", name: "Miwa", school: "SMA Negeri 1 Palembang", gender: "Perempuan", hobby: "Membaca & Literasi", univ: "Universitas Sriwijaya", ig: "@miwa.research" }
  ];
  const stored = JSON.parse(localStorage.getItem('ANORA_CLASS_DIRECTORY') || '[]');
  const merged = [...stored];
  defaultPeers.forEach(p => {
    if (!merged.some(m => m.id === p.id)) merged.push(p);
  });

  const grid = document.getElementById('classmates-grid');
  grid.innerHTML = merged.map(p => {
    const igUrl = p.ig.startsWith('http') ? p.ig : `https://instagram.com/${p.ig.replace(/^@/, '')}`;
    const borderCol = p.gender === 'Perempuan' ? '#f9a8d4' : '#93c5fd';
    const bgCol = p.gender === 'Perempuan' ? '#fdf2f8' : '#eff6ff';
    return `
      <div class="classmate-card" style="background:${bgCol}; border:1.5px solid ${borderCol};">
        <strong style="font-size:16px;">${p.name}</strong>
        <p style="font-size:12.5px; color:var(--text-muted);">${p.school}</p>
        <p style="font-size:12.5px; margin-top:6px;"><strong>Hobi:</strong> ${p.hobby}</p>
        <p style="font-size:12.5px;"><strong>Kampus Impian:</strong> ${p.univ}</p>
        <a href="${igUrl}" target="_blank" rel="noopener noreferrer" class="ig-link-btn" style="margin-top:10px; font-size:11.5px; padding:6px 12px;">Instagram (${p.ig})</a>
      </div>
    `;
  }).join('');
}

// 13. PANEL DATA PENELITI & EXPORT CSV
function recordLog(moduleName, answerVal, statusText) {
  researchLogs.unshift({
    time: new Date().toLocaleTimeString('id-ID'),
    id: currentUser ? currentUser.id : '-',
    name: currentUser ? currentUser.name : '-',
    school: currentUser ? (currentUser.school || '-') : '-',
    module: moduleName,
    answer: answerVal,
    status: statusText
  });
  const tbody = document.getElementById('diagnostic-log-body');
  if (!tbody) return;
  tbody.innerHTML = researchLogs.map(l => `
    <tr>
      <td>${l.time}</td>
      <td>${l.id}</td>
      <td><strong>${l.name}</strong></td>
      <td>${l.school}</td>
      <td>${l.module}</td>
      <td>${l.answer}</td>
      <td>${l.status}</td>
    </tr>
  `).join('');
}

document.getElementById('upload-roster-file').addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (f) {
    document.getElementById('roster-status-text').textContent = `Berkas "${f.name}" berhasil disimpan ke dalam sistem.`;
    playSoundEffect('success');
  }
});

document.getElementById('export-csv-btn').addEventListener('click', () => {
  let csv = 'Waktu,ID,Nama,Sekolah,Modul_Aktivitas,Respons_Siswa,Status\n';
  researchLogs.forEach(l => {
    csv += `"${l.time}","${l.id}","${l.name}","${l.school}","${l.module}","${l.answer}","${l.status}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Database_Penelitian_ANORA.csv';
  a.click();
  playSoundEffect('success');
});