let currentUser = null;
let currentMode = 'BISINDO';
let userXP = 0;
let userStreak = 1;
let completedChapters = {};
let activeDictCategory = "ALL";

let dictionaryData = [];
let curriculumData = {};

let activeChapterId = 1;
let currentQuestionIndex = 0;
let chapterScore = 0;

document.addEventListener("DOMContentLoaded", async () => {
    applySavedContrast();
    await checkUserSession();
    await loadAllDataFromSupabase();
    updateTopbarUI();
    setSignMode(currentMode, false);
    renderDictionary();
    await renderLeaderboard();
});

// 1. Cek Sesi Login User
async function checkUserSession() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    currentUser = user;

    const userNameEl = document.getElementById("user-name");
    if (currentUser) {
        const { data: profile } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

        if (profile) {
            userNameEl.innerText = profile.full_name;
            userXP = profile.total_xp;
            userStreak = profile.streak_days;
            currentMode = profile.preferred_mode || 'BISINDO';

            // Tampilkan menu Panel Admin jika role === 'admin'
            if (profile.role === 'admin') {
                userNameEl.innerHTML = `${profile.full_name} <span class="badge badge-danger ml-1">Admin</span>`;
                const navAdmin = document.getElementById("nav-admin");
                if (navAdmin) navAdmin.classList.remove("d-none");
            }
        }
        // Ambil riwayat bab yang sudah selesai
        const { data: progressRows } = await supabaseClient
            .from("user_progress")
            .select("chapter_id")
            .eq("user_id", currentUser.id)
            .eq("completed", true);

        if (progressRows) {
            progressRows.forEach(row => {
                completedChapters[row.chapter_id] = true;
            });
        }
    } else {
        userNameEl.innerHTML = `<a href="login.html" class="text-primary font-weight-bold">Masuk / Daftar</a>`;
    }
}

// 2. Muat Kamus & Soal Kuis dari Tabel Supabase
async function loadAllDataFromSupabase() {
    // Ambil Kamus
    const { data: dictRows } = await supabaseClient
        .from("dictionary")
        .select("*")
        .order("id", { ascending: true });

    if (dictRows) dictionaryData = dictRows;
    renderCategoryFilters();

    // Ambil Bab & Soal
    const { data: chapters } = await supabaseClient.from("chapters").select("*").order("id");
    const { data: questions } = await supabaseClient.from("questions").select("*").order("id");

    if (chapters && questions) {
        chapters.forEach(ch => {
            curriculumData[ch.id] = {
                title: ch.title,
                xpReward: ch.xp_reward,
                questions: questions.filter(q => q.chapter_id === ch.id)
            };
        });
    }
}

// Navigasi Antar Halaman
function switchSection(sectionName) {
    document.querySelectorAll(".app-section").forEach(sec => sec.classList.add("d-none"));
    const target = document.getElementById(`section-${sectionName}`);
    if (target) target.classList.remove("d-none");

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

// Ganti Mode BISINDO / SIBI & Simpan ke Database
async function setSignMode(mode, saveToDb = true) {
    currentMode = mode;

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

    if (saveToDb && currentUser) {
        await supabaseClient
            .from("profiles")
            .update({ preferred_mode: mode })
            .eq("id", currentUser.id);
    }

    renderDictionary();
}

// Terapkan status kontras yang tersimpan di browser
function applySavedContrast() {
    const isHighContrast = localStorage.getItem('highContrast') === 'true';
    const btn = document.getElementById("btn-contrast");
    if (isHighContrast) {
        document.body.classList.add("high-contrast");
        if (btn) btn.className = "btn btn-sm btn-warning text-dark font-weight-bold";
    } else {
        document.body.classList.remove("high-contrast");
        if (btn) btn.className = "btn btn-sm btn-outline-dark";
    }
}

// Toggle Mode Kontras Tinggi (GEDSI Accessibility)
function toggleHighContrast() {
    const isNowActive = document.body.classList.toggle("high-contrast");
    localStorage.setItem('highContrast', isNowActive);
    applySavedContrast();
}

// Render Kamus dari Data Supabase
// Otomatis membuat tombol & dropdown kategori berdasarkan isi tabel 'dictionary' di Supabase
function renderCategoryFilters() {
    const selectEl = document.getElementById("kamus-category");
    const pillsEl = document.getElementById("kamus-category-pills");
    if (!selectEl || !pillsEl) return;

    // Ambil daftar kategori unik dari database
    const uniqueCategories = [...new Set(dictionaryData.map(item => item.kategori).filter(Boolean))];

    if (activeDictCategory !== "ALL" && !uniqueCategories.includes(activeDictCategory)) {
        activeDictCategory = "ALL";
    }

    // 1. Isi Dropdown <select>
    selectEl.innerHTML = `<option value="ALL">Semua Kategori (${dictionaryData.length})</option>` +
        uniqueCategories.map(cat => {
            const count = dictionaryData.filter(d => d.kategori === cat).length;
            return `<option value="${cat}" ${activeDictCategory === cat ? 'selected' : ''}>${cat} (${count})</option>`;
        }).join("");

    // 2. Isi Tombol Pill Kategori
    const allBtnClass = activeDictCategory === "ALL" ? "btn-primary" : "btn-outline-primary";
    let pillsHtml = `<button type="button" class="btn btn-sm ${allBtnClass} font-weight-bold mr-2 mb-2" onclick="setDictionaryCategory('ALL')">Semua (${dictionaryData.length})</button>`;

    pillsHtml += uniqueCategories.map(cat => {
        const count = dictionaryData.filter(d => d.kategori === cat).length;
        const btnClass = activeDictCategory === cat ? "btn-primary" : "btn-outline-primary";
        const safeCat = cat.replace(/'/g, "\\'");
        return `<button type="button" class="btn btn-sm ${btnClass} font-weight-bold mr-2 mb-2" onclick="setDictionaryCategory('${safeCat}')">${cat} (${count})</button>`;
    }).join("");

    pillsEl.innerHTML = pillsHtml;
}

function setDictionaryCategory(category) {
    activeDictCategory = category;
    renderCategoryFilters();
    renderDictionary();
}

function renderDictionary() {
    const grid = document.getElementById("kamus-grid");
    if (!grid) return;

    const keyword = (document.getElementById("kamus-search")?.value || "").toLowerCase();

    const filtered = dictionaryData.filter(item => {
        const matchWord = item.kata.toLowerCase().includes(keyword);
        const matchCat = (activeDictCategory === "ALL" || item.kategori === activeDictCategory);
        return matchWord && matchCat;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning text-center">
                    Kosakata tidak ditemukan pada kategori <strong>${activeDictCategory}</strong>.
                </div>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map(item => {
        const movementDesc = (currentMode === 'BISINDO') ? item.desc_bisindo : item.desc_sibi;
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
                        <button class="btn btn-outline-primary btn-block font-weight-bold mt-2" onclick="openDictModal(${item.id})">
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
    document.getElementById("dictModalDesc").innerText = (currentMode === 'BISINDO') ? item.desc_bisindo : item.desc_sibi;

    const videoPlayer = document.getElementById("dict-video-player");
    const videoSource = document.getElementById("dict-video-source");
    videoSource.src = (currentMode === 'BISINDO') ? item.video_bisindo : item.video_sibi;
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

// Render Leaderboard Real-Time dari Tabel 'profiles'
async function renderLeaderboard() {
    const tbody = document.getElementById("leaderboard-body");
    if (!tbody) return;

    const { data: players } = await supabaseClient
        .from("profiles")
        .select("*")
        .order("total_xp", { ascending: false })
        .limit(10);

    if (!players || players.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">Belum ada data pembelajar terdaftar.</td></tr>`;
        return;
    }

    tbody.innerHTML = players.map((p, index) => {
        const rank = index + 1;
        let rankBadge = `<span class="font-weight-bold">#${rank}</span>`;
        if (rank === 1) rankBadge = `<span class="badge badge-warning text-dark px-2 py-1"><i class="fas fa-crown mr-1"></i>#1</span>`;
        if (rank === 2) rankBadge = `<span class="badge badge-secondary px-2 py-1">#2</span>`;
        if (rank === 3) rankBadge = `<span class="badge badge-info px-2 py-1">#3</span>`;

        const isMe = currentUser && p.id === currentUser.id;
        const rowClass = isMe ? "table-primary font-weight-bold text-dark" : "text-dark";

        return `
            <tr class="${rowClass}">
                <td class="text-center">${rankBadge}</td>
                <td>${p.full_name} ${isMe ? '(Kamu)' : ''}</td>
                <td><span class="badge badge-light border text-dark">${p.preferred_mode}</span></td>
                <td class="text-center"><i class="fas fa-fire text-danger mr-1"></i>${p.streak_days} Hari</td>
                <td class="text-right font-weight-bold text-success">${p.total_xp} XP</td>
            </tr>
        `;
    }).join("");
}

// Logika Kuis Interaktif
function startQuiz(chapterId) {
    if (!curriculumData[chapterId] || curriculumData[chapterId].questions.length === 0) {
        alert("Soal untuk bab ini sedang dimuat atau belum tersedia di database.");
        return;
    }
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
    document.getElementById("quiz-progress-bar").style.width = Math.round((currentQuestionIndex / totalQ) * 100) + "%";

    const videoContainer = document.getElementById("quiz-video-container");
    const videoPlayer = document.getElementById("sign-video-player");
    const videoSource = document.getElementById("sign-video-source");

    if (q.type === "video") {
        videoContainer.classList.remove("d-none");
        videoSource.src = (currentMode === 'BISINDO') ? q.video_bisindo : q.video_sibi;
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
        if (idx === q.correct_index) b.classList.add("correct");
    });

    const feedbackBox = document.getElementById("quiz-feedback");
    const feedbackTitle = document.getElementById("feedback-title");
    const feedbackExp = document.getElementById("feedback-explanation");

    feedbackBox.classList.remove("d-none", "alert-success", "alert-danger");

    if (selectedIndex === q.correct_index) {
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

async function nextQuestion() {
    const chapter = curriculumData[activeChapterId];
    currentQuestionIndex++;

    if (currentQuestionIndex < chapter.questions.length) {
        renderQuestion();
    } else {
        document.getElementById("quiz-progress-bar").style.width = "100%";
        userXP += chapter.xpReward;
        completedChapters[activeChapterId] = true;

        // Simpan XP dan status bab ke database Supabase jika user login
        if (currentUser) {
            await supabaseClient
                .from("profiles")
                .update({ total_xp: userXP })
                .eq("id", currentUser.id);

            await supabaseClient
                .from("user_progress")
                .upsert({
                    user_id: currentUser.id,
                    chapter_id: activeChapterId,
                    completed: true
                }, { onConflict: 'user_id,chapter_id' });
        }

        updateTopbarUI();
        await renderLeaderboard();
        $('#quizModal').modal('hide');
        alert(`Selamat! Kamu menyelesaikan ${chapter.title} dan mendapatkan +${chapter.xpReward} XP!`);
    }
}

async function logoutUser() {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('signMode');
    window.location.href = "index.html";
}