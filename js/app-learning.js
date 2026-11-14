// State Utama Aplikasi
let currentMode = localStorage.getItem('signMode') || 'BISINDO';
let userXP = parseInt(localStorage.getItem('userXP')) || 120;
let userStreak = parseInt(localStorage.getItem('userStreak')) || 3;
let completedChapters = JSON.parse(localStorage.getItem('completedChapters')) || {};

let activeChapterId = 1;
let currentQuestionIndex = 0;
let chapterScore = 0;

// Bank Materi & Soal (Nanti bisa ditarik langsung dari Database Supabase)
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
});

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
}

// Toggle Mode Kontras Tinggi (GEDSI Accessibility)
function toggleHighContrast() {
    document.body.classList.toggle("high-contrast");
}

// Mulai Kuis Bab Tertentu
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

    // Update Header & Progress Bar
    document.getElementById("quizModalTitle").innerText = `${chapter.title} (${currentQuestionIndex + 1}/${totalQ})`;
    document.getElementById("quizModeBadge").innerText = currentMode;
    const progressPct = Math.round(((currentQuestionIndex) / totalQ) * 100);
    document.getElementById("quiz-progress-bar").style.width = progressPct + "%";

    // Tampilkan / Sembunyikan Pemutar Video
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

    // Render Pertanyaan & Opsi Jawaban
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

    // Reset Feedback & Tombol Lanjut
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

    // Nonaktifkan semua tombol setelah memilih
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
        // Selesai Bab
        document.getElementById("quiz-progress-bar").style.width = "100%";
        userXP += chapter.xpReward;
        completedChapters[activeChapterId] = true;

        localStorage.setItem('userXP', userXP);
        localStorage.setItem('completedChapters', JSON.stringify(completedChapters));

        updateTopbarUI();
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
}