// ===============================
// Myat Digital Shop - APP.JS FINAL
// ===============================

const API_URL = "https://smm-panel1.onrender.com"; // 🔴 Render URL ထည့်ရမယ်

const tg = window.Telegram?.WebApp;

// ---------------- INIT ----------------
if (tg) {
    tg.expand();
}

// ---------------- USER DATA ----------------
let user = null;
let balance = 0;

// ---------------- LOGIN ----------------
async function loginUser() {
    try {
        if (!tg || !tg.initDataUnsafe?.user) return;

        user = tg.initDataUnsafe.user;

        const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: user.id,
                first_name: user.first_name,
                username: user.username
            })
        });

        const data = await res.json();

        if (data.success) {
            balance = data.user.points || 0;
            updateUI();
        }
    } catch (err) {
        console.log("Login error:", err);
    }
}

// ---------------- UPDATE UI ----------------
function updateUI() {
    const balanceEl = document.querySelector("#wallet h1");
    if (balanceEl) {
        balanceEl.innerText = balance;
    }
}

// ---------------- NAVIGATION ----------------
function showPage(pageId, element) {
    haptic();

    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active-page');
        p.style.display = "none";
    });

    const active = document.getElementById(pageId);
    if (active) {
        active.classList.add('active-page');
        active.style.display = "flex";
    }

    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });

    if (element) element.classList.add('active');
}

// ---------------- HAPTIC ----------------
function haptic() {
    if (tg) {
        tg.HapticFeedback.impactOccurred('medium');
    }
}

// ---------------- DAILY REWARD ----------------
async function claimDaily() {
    try {
        haptic();

        const res = await fetch(`${API_URL}/api/daily`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: user?.id })
        });

        const data = await res.json();

        if (data.success) {
            balance += data.reward;
            updateUI();
            tg?.showAlert(`🎁 +${data.reward} Points received!`);
        } else {
            tg?.showAlert(data.message || "Already claimed today!");
        }
    } catch (err) {
        console.log(err);
    }
}

// ---------------- JOIN CHANNEL ----------------
function joinChannel() {
    haptic();
    window.open("https://t.me/Myat_2055", "_blank");
}

// ---------------- INVITE ----------------
function inviteFriends() {
    haptic();

    const link = `https://t.me/Myatt_205bot?start=${user?.id}`;

    if (tg?.shareToStory) {
        tg.shareToStory(link);
    } else {
        tg?.showAlert("Invite link copied!");
        navigator.clipboard.writeText(link);
    }
}

// ---------------- WITHDRAW ----------------
async function withdraw() {
    try {
        haptic();

        const res = await fetch(`${API_URL}/api/withdraw`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: user?.id,
                amount: balance
            })
        });

        const data = await res.json();

        if (data.success) {
            tg?.showAlert("Withdraw request sent!");
        } else {
            tg?.showAlert(data.message || "Not enough points!");
        }
    } catch (err) {
        console.log(err);
    }
}

// ---------------- COUNTDOWN (optional override) ----------------
function updateCountdown() {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const diff = end - now;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    const el = document.getElementById("countdown");
    if (el) {
        el.innerText =
            `${days}D : ${hours.toString().padStart(2, '0')}H : ` +
            `${mins.toString().padStart(2, '0')}M : ${secs.toString().padStart(2, '0')}S`;
    }
}

setInterval(updateCountdown, 1000);

// ---------------- START ----------------
loginUser();
updateCountdown();
