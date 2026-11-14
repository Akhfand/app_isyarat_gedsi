// State Utama Aplikasi
let currentMode = localStorage.getItem('signMode') || 'BISINDO';
let userXP = parseInt(localStorage.getItem('userXP')) || 120;
let userStreak = parseInt(localStorage.getItem('userStreak')) || 3;
let completedChapters = JSON.parse(localStorage.getItem('completedChapters')) || {};

let activeChapterId = 1;
let currentQuestionIndex = 0;
let chapterScore = 0;

// 1. Bank Data Kamus Isyarat (BISINDO & SIBI)
const dictionaryData = [
    {
        id: "d1",
        kata: "Halo",
        kategori: "Sapaan",
        videoBisindo: "assets/video/bisindo/halo.mp4",
        videoSibi: "assets/video/sibi/halo.mp4",
        descBisindo: "Angkat telapak tangan terbuka di samping kepala dengan ekspresi ramah, lalu lambaikan ringan ke arah lawan bicara.",
        descSibi: "Posisikan tangan kanan terbuka di dekat pelipis seperti hormat ringan lalu gerakkan menjauh ke depan."
    },
    {
        id: "d2",
        kata: "Terima Kasih",
        kategori: "Sopan Santun",
        videoBisindo: "assets/video/bisindo/terima_kasih.mp4",
        videoSibi: "assets/video/sibi/terima_kasih.mp4",
        descBisindo: "Sentuh dagu dengan ujung jari telapak tangan terbuka, lalu gerakkan ke depan bawah ke arah lawan bicara.",
        descSibi: "Ujung jari menyentuh bibir/dagu lalu digerakkan mendatar ke depan dengan telapak menghadap ke atas."
    },
    {
        id: "d3",
        kata: "Sama-sama",
        kategori: "Sopan Santun",
        videoBisindo: "assets/video/bisindo/sama_sama.mp4",
        videoSibi: "assets/video/sibi/sama_sama.mp4",
        descBisindo: "Arahkan kedua jari telunjuk sejajar ke depan lalu gerakkan sedikit maju-mundur secara bersamaan.",
        descSibi: "Tangan membentuk huruf 'Y' (ibu jari dan kelingking terbuka), digerakkan menyamping bergantian."
    },
    {
        id: "d4",
        kata: "Maaf",
        kategori: "Sopan Santun",
        videoBisindo: "assets/video/bisindo/maaf.mp4",
        videoSibi: "assets/video/sibi/maaf.mp4",
        descBisindo: "Tempelkan telapak tangan di dada dengan ekspresi menyesal, lalu usap memutar perlahan.",
        descSibi: "Tangan mengepal (huruf 'A' SIBI) ditempelkan di tengah dada lalu diputar searah jarum jam."
    },
    {
        id: "d5",
        kata: "Tolong / Bantuan",
        kategori: "Darurat",
        videoBisindo: "assets/video/bisindo/tolong.mp4",
        videoSibi: "assets/video/sibi/tolong.mp4",
        descBisindo: "Telapak tangan kiri terbuka ke atas, kepalan tangan kanan diletakkan di atasnya lalu diangkat bersama ke atas.",
        descSibi: "Tangan kanan mengepal dengan ibu jari teracung di atas telapak tangan kiri, lalu diangkat ke atas."
    },
    {
        id: "d6",
        kata: "Setara / Adil",
        kategori: "Peran & Inklusi",
        videoBisindo: "assets/video/bisindo/setara.mp4",
        videoSibi: "assets/video/sibi/setara.mp4",
        descBisindo: "Kedua telapak tangan terbuka menghadap ke bawah pada ketinggian sejajar di depan dada.",
        descSibi: "Kedua tangan membentuk posisi sejajar seimbang di depan tubuh seperti timbangan rata."
    },
    {
        id: "d7",
        kata: "Mahasiswa",
        kategori: "Peran & Inklusi",
        videoBisindo: "assets/video/bisindo/mahasiswa.mp4",
        videoSibi: "assets/video/sibi/mahasiswa.mp4",
        descBisindo: "Peragakan gerakan mengambil ilmu dari telapak tangan lalu menyentuh pelipis/dahi.",
        descSibi: "Isyarat kata 'belajar' diikuti posisi tangan membentuk tanda tingkat pendidikan tinggi."
    },
    {
        id: "d8",
        kata: "Sakit / Bahaya",
        kategori: "Darurat",
        videoBisindo: "assets/video/bisindo/sakit.mp4",
        videoSibi: "assets/video/sibi/sakit.mp4",
        descBisindo: "Arahkan kedua jari telunjuk saling berhadapan di depan area tubuh yang sakit dengan mimik meringis.",
        descSibi: "Kedua jari tengah ditekuk sedikit dan digerakkan mendekat-menjauh di depan dada."
    }
];

// 2. Bank Materi & Soal Kuis Bab 1-3
const curriculumData = {
    1: {
        title: "Bab 1: Fondasi Komunikasi & Budaya Tuli",
        xpReward: 50,
        questions: [
            {
                type: "video",
                videoBisindo: "assets/video/bisindo/terima_kasih.mp4",
                videoSibi: "assets/video/sibi/terima_kasih.mp4",
                question: "Apa arti gerakan bahasa isyarat pada video di atas?",
                options: ["Maaf", "Terima Kasih", "Selamat Pagi", "Tolong"],
                correctIndex: 1,
                explanation: "Gerakan menyentuh dagu lalu mengarahkannya ke depan berarti 'Terima Kasih'."
            },
            {
                type: "gedsi",
                question: "[Studi Kasus GEDSI] Kamu melihat teman Tuli menjatuhkan bukunya di koridor kampus dan ia sedang berjalan membelakangimu. Apa tindakan paling tepat?",
                options: [
                    "Berteriak memanggil namanya sekeras mungkin",
                    "Menarik tasnya dari belakang agar ia berhenti",
                    "Menyusulnya, menepuk bahunya perlahan, lalu menunjuk buku yang jatuh"
                ],
                correctIndex: 2,
                explanation: "Menepuk bahu perlahan dalam jangkauan sopan adalah etika memanggil teman Tuli tanpa mengejutkan."
            },
            {
                type: "gedsi",
                question: "[Literasi Budaya Tuli] Istilah manakah yang lebih dihormati oleh komunitas pengguna bahasa isyarat di Indonesia?",
                options: [
                    "Tuli (dengan huruf T kapital)",
                    "Tunarungu / Bisu",
                    "Orang cacat pendengaran"
                ],
                correctIndex: 0,
                explanation: "Kata 'Tuli' merepresentasikan identitas budaya, bahasa, dan kebanggaan komunitas, bukan sekadar label medis."
            }
        ]
    },
    2: {
        title: "Bab 2: Kesetaraan Gender & Ruang Inklusif",
        xpReward: 60,
        questions: [
            {
                type: "gedsi",
                question: "[Studi Kasus GEDSI] Dalam tugas kelompok pemrograman, anggota perempuan otomatis hanya diminta membuat laporan sementara anggota laki-laki memegang coding. Sikap inklusif yang tepat adalah...",
                options: [
                    "Membagi peran berdasarkan minat dan kesepakatan bersama tanpa stereotip gender",
                    "Membiarkannya karena sudah kebiasaan umum",
                    "Melarang anggota perempuan menyentuh kode program"
                ],
                correctIndex: 0,
                explanation: "Kesetaraan gender memastikan setiap individu mendapat kesempatan yang adil sesuai kompetensi dan minatnya."
            },
            {
                type: "video",
                videoBisindo: "assets/video/bisindo/sama_sama.mp4",
                videoSibi: "assets/video/sibi/sama_sama.mp4",
                question: "Perhatikan kecepatan gerakan video (gunakan tombol 0.5x jika perlu). Kosakata apakah ini?",
                options: ["Bekerja Sama", "Sama-sama", "Belajar", "Selesai"],
                correctIndex: 1,
                explanation: "Isyarat ini digunakan sebagai balasan sopan ketika seseorang mengucapkan terima kasih."
            }
        ]
    },
    3: {
        title: "Bab 3: Situasi Darurat & Advokasi Sosial",
        xpReward: 70,
        questions: [
            {
                type: "gedsi",
                question: "[Etika Disabilitas] Kamu melihat pengguna kursi roda hendak melewati tanjakan (ramp) di depan gedung kampus. Apa yang sebaiknya kamu lakukan?",
                options: [
                    "Langsung memegang pegangan kursi roda dan mendorongnya tanpa bicara",
                    "Bertanya terlebih dahulu: 'Permisi, apakah perlu bantuan untuk didorong?'",
                    "Menghalangi jalan sambil menatap terus-menerus"
                ],
                correctIndex: 1,
                explanation: "Kursi roda adalah bagian dari ruang personal penggunanya. Selalu minta izin sebelum menyentuh atau mendorong."
            }
        ]
    }
};

// Inisialisasi saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
    updateTopbarUI();
    setSignMode(currentMode);
    renderDictionary();
    renderLeaderboard();
});

// Navigasi Antar Halaman (Sidebar)
function switchSection(sectionName) {
    // Sembunyikan semua section
    document.querySelectorAll(".app-section").forEach(sec => sec.classList.add("d-none"));
    // Tampilkan section yang dipilih
    const target = document.getElementById(`section-${sectionName}`);
    if (target) target.classList.remove("d-none");

    // Update highlight menu aktif di sidebar
    document.querySelectorAll("#accordionSidebar .nav-item").forEach(item => item.classList.remove("active"));
    const activeNav = document.getElementById(`nav-${sectionName}`);
    if (activeNav) activeNav.classList.add("active");

    if (sectionName === "kamus") renderDictionary();
    if (sectionName === "leaderboard") renderLeaderboard();
}

function updateTopbarUI() {
    document.getElementById("user-xp").innerText = userXP;
    document.getElementById("user-streak").innerText = userStreak;

    [1, 2, 3].forEach(bab => {
        const pct = completedChapters[bab] ? 100 : 0;
        document.getElementById(`prog-bab-${bab}-text`).innerText = pct + "%";
        document.getElementById(`prog-bab-${bab}-bar`).style.width = pct + "%";
    });
}

// Ganti Mode BISINDO vs SIBI
function setSignMode(mode) {
    currentMode = mode;
    localStorage.setItem('signMode', mode);

    const btnBisindo = document.getElementById("btn-mode-bisindo");
    const btnSibi = document.getElementById("btn-mode-sibi");
    const label = document.getElementById("active-mode-label");
    const desc = document.getElementById("active-mode-desc");
    const kamusTitle = document.getElementById("kamus-mode-title");

    if (kamusTitle) kamusTitle.innerText = mode;

    if (mode === 'BISINDO') {
        btnBisindo.className = "btn btn-primary font-weight-bold active";
        btnSibi.className = "btn btn-outline-primary font-weight-bold";
        label.innerText = "BISINDO";
        desc.innerHTML = "<strong>BISINDO (Bahasa Isyarat Indonesia):</strong> Bahasa isyarat alami komunitas Tuli Indonesia (abjad 2 tangan & ekspresi wajah).";
    } else {
        btnSibi.className = "btn btn-primary font-weight-bold active";
        btnBisindo.className = "btn btn-outline-primary font-weight-bold";
        label.innerText = "SIBI";
        desc.innerHTML = "<strong>SIBI (Sistem Isyarat Bahasa Indonesia):</strong> Sistem isyarat baku sesuai tata bahasa Indonesia (abjad 1 tangan & memakai imbuhan).";
    }

    renderDictionary();
    renderLeaderboard();
}

// Toggle Mode Kontras Tinggi (GEDSI Accessibility)
function toggleHighContrast() {
    document.body.classList.toggle("high-contrast");
}

// =========================================================
// LOGIKA KAMUS ISYARAT
// =========================================================
function renderDictionary() {
    const grid = document.getElementById("kamus-grid");
    if (!grid) return;

    const keyword = (document.getElementById("kamus-search")?.value || "").toLowerCase();
    const category = document.getElementById("kamus-category")?.value || "ALL";

    const filtered = dictionaryData.filter(item => {
        const matchWord = item.kata.toLowerCase().includes(keyword);
        const matchCat = (category === "ALL" || item.kategori === category);
        return matchWord && matchCat;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning text-center">
                    Kosakata "<strong>${keyword}</strong>" tidak ditemukan pada kategori ini.
                </div>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map(item => {
        const movementDesc = (currentMode === 'BISINDO') ? item.descBisindo : item.descSibi;
        return `
            <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
                <div class="card chapter-card shadow-sm h-100">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge badge-light border text-dark">${item.kategori}</span>
                            <span class="badge badge-primary">${currentMode}</span>
                        </div>
                        <h5 class="font-weight-bold text-dark mb-2">${item.kata}</h5>
                        <p class="small text-dark flex-grow-1">${movementDesc}</p>
                        <button class="btn btn-outline-primary btn-block font-weight-bold mt-2" onclick="openDictModal('${item.id}')">
                            <i class="fas fa-video mr-1"></i> Putar Video Isyarat
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function openDictModal(dictId) {
    const item = dictionaryData.find(d => d.id === dictId);
    if (!item) return;

    document.getElementById("dictModalTitle").innerText = `Isyarat: "${item.kata}"`;
    document.getElementById("dictModalModeBadge").innerText = currentMode;
    document.getElementById("dictModalDesc").innerText = (currentMode === 'BISINDO') ? item.descBisindo : item.descSibi;

    const videoPlayer = document.getElementById("dict-video-player");
    const videoSource = document.getElementById("dict-video-source");
    videoSource.src = (currentMode === 'BISINDO') ? item.videoBisindo : item.videoSibi;
    videoPlayer.load();
    setDictVideoSpeed(1.0);

    $('#dictVideoModal').modal('show');
}

function setDictVideoSpeed(rate) {
    const video = document.getElementById("dict-video-player");
    video.playbackRate = rate;
    document.getElementById("dict-speed-normal").className = (rate === 1.0) ? "btn btn-secondary active" : "btn btn-outline-secondary";
    document.getElementById("dict-speed-slow").className = (rate === 0.5) ? "btn btn-secondary active" : "btn btn-outline-secondary";
}

// =========================================================
// LOGIKA LEADERBOARD (PAPAN PERINGKAT)
// =========================================================
function renderLeaderboard() {
    const tbody = document.getElementById("leaderboard-body");
    if (!tbody) return;

    const players = [
        { name: "Rina Maharani", mode: "BISINDO", streak: 7, xp: 340, isMe: false },
        { name: "Dimas Pratama", mode: "SIBI", streak: 5, xp: 250, isMe: false },
        { name: "Siti Aisyah", mode: "BISINDO", streak: 4, xp: 180, isMe: false },
        { name: "Pembelajar Inklusif (Kamu)", mode: currentMode, streak: userStreak, xp: userXP, isMe: true },
        { name: "Budi Santoso", mode: "SIBI", streak: 1, xp: 90, isMe: false }
    ];

    // Urutkan dari XP tertinggi
    players.sort((a, b) => b.xp - a.xp);

    tbody.innerHTML = players.map((p, index) => {
        const rank = index + 1;
        let rankBadge = `<span class="font-weight-bold">#${rank}</span>`;
        if (rank === 1) rankBadge = `<span class="badge badge-warning text-dark px-2 py-1"><i class="fas fa-crown mr-1"></i>#1</span>`;
        if (rank === 2) rankBadge = `<span class="badge badge-secondary px-2 py-1">#2</span>`;
        if (rank === 3) rankBadge = `<span class="badge badge-info px-2 py-1">#3</span>`;

        const rowClass = p.isMe ? "table-primary font-weight-bold text-dark" : "text-dark";

        return `
            <tr class="${rowClass}">
                <td class="text-center">${rankBadge}</td>
                <td>${p.name}</td>
                <td><span class="badge badge-light border text-dark">${p.mode}</span></td>
                <td class="text-center"><i class="fas fa-fire text-danger mr-1"></i>${p.streak} Hari</td>
                <td class="text-right font-weight-bold text-success">${p.xp} XP</td>
            </tr>
        `;
    }).join("");
}

// =========================================================
// LOGIKA KUIS INTERAKTIF
// =========================================================
function startQuiz(chapterId) {
    activeChapterId = chapterId;
    currentQuestionIndex = 0;
    chapterScore = 0;
    renderQuestion();
    $('#quizModal').modal('show');
}

function renderQuestion() {
    const chapter = curriculumData[activeChapterId];
    const q = chapter.questions[currentQuestionIndex];
    const totalQ = chapter.questions.length;

    document.getElementById("quizModalTitle").innerText = `${chapter.title} (${currentQuestionIndex + 1}/${totalQ})`;
    document.getElementById("quizModeBadge").innerText = currentMode;
    const progressPct = Math.round(((currentQuestionIndex) / totalQ) * 100);
    document.getElementById("quiz-progress-bar").style.width = progressPct + "%";

    const videoContainer = document.getElementById("quiz-video-container");
    const videoPlayer = document.getElementById("sign-video-player");
    const videoSource = document.getElementById("sign-video-source");

    if (q.type === "video") {
        videoContainer.classList.remove("d-none");
        videoSource.src = (currentMode === 'BISINDO') ? q.videoBisindo : q.videoSibi;
        videoPlayer.load();
        setVideoSpeed(1.0);
    } else {
        videoContainer.classList.add("d-none");
        videoPlayer.pause();
    }

    document.getElementById("quiz-question-text").innerText = q.question;
    const optionsContainer = document.getElementById("quiz-options-container");
    optionsContainer.innerHTML = "";

    q.options.forEach((optText, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-block quiz-option-btn";
        btn.innerText = optText;
        btn.onclick = () => checkAnswer(idx, btn);
        optionsContainer.appendChild(btn);
    });

    document.getElementById("quiz-feedback").classList.add("d-none");
    document.getElementById("btn-next-question").classList.add("d-none");
}

function setVideoSpeed(rate) {
    const video = document.getElementById("sign-video-player");
    video.playbackRate = rate;

    document.getElementById("btn-speed-normal").className = (rate === 1.0) ? "btn btn-secondary active" : "btn btn-outline-secondary";
    document.getElementById("btn-speed-slow").className = (rate === 0.5) ? "btn btn-secondary active" : "btn btn-outline-secondary";
}

function checkAnswer(selectedIndex, clickedBtn) {
    const q = curriculumData[activeChapterId].questions[currentQuestionIndex];
    const allBtns = document.querySelectorAll(".quiz-option-btn");

    allBtns.forEach((b, idx) => {
        b.disabled = true;
        if (idx === q.correctIndex) b.classList.add("correct");
    });

    const feedbackBox = document.getElementById("quiz-feedback");
    const feedbackTitle = document.getElementById("feedback-title");
    const feedbackExp = document.getElementById("feedback-explanation");

    feedbackBox.classList.remove("d-none", "alert-success", "alert-danger");

    if (selectedIndex === q.correctIndex) {
        chapterScore++;
        feedbackBox.classList.add("alert-success");
        feedbackTitle.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Tepat Sekali!';
    } else {
        clickedBtn.classList.add("wrong");
        feedbackBox.classList.add("alert-danger");
        feedbackTitle.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Kurang Tepat';
    }

    feedbackExp.innerText = q.explanation;
    document.getElementById("btn-next-question").classList.remove("d-none");
}

function nextQuestion() {
    const chapter = curriculumData[activeChapterId];
    currentQuestionIndex++;

    if (currentQuestionIndex < chapter.questions.length) {
        renderQuestion();
    } else {
        document.getElementById("quiz-progress-bar").style.width = "100%";
        userXP += chapter.xpReward;
        completedChapters[activeChapterId] = true;

        localStorage.setItem('userXP', userXP);
        localStorage.setItem('completedChapters', JSON.stringify(completedChapters));

        updateTopbarUI();
        renderLeaderboard();
        $('#quizModal').modal('hide');
        alert(`Selamat! Kamu menyelesaikan ${chapter.title} dan mendapatkan +${chapter.xpReward} XP!`);
    }
}

function resetProgress() {
    localStorage.clear();
    userXP = 0;
    userStreak = 1;
    completedChapters = {};
    updateTopbarUI();
    renderLeaderboard();
}