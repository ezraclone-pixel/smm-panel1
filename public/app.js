const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;

// ---------------- API URL ----------------
const API_URL = "https://smm-panel1.onrender.com";

// ---------------- CURRENT USER ----------------
let currentUser = null;
let countdownInterval = null;

// ---------------- LOGIN + REFERRAL ----------------
async function login() {

    if (!user) {
        alert("Open inside Telegram");
        return;
    }

    try {

        const startParam =
            Telegram.WebApp.initDataUnsafe.start_param;

        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                telegramId: String(user.id),
                name: user.first_name,
                ref: startParam || null
            })
        });

        currentUser = await res.json();

        updateUI();

    } catch (err) {

        console.log(err);
        alert("Server connection failed");
    }
}

// ---------------- UPDATE UI ----------------
function updateUI() {

    if (!currentUser) return;

    const username =
        document.getElementById("username");

    if (username) {
        username.innerText =
            currentUser.name || "User";
    }

    document.querySelectorAll("#balance")
        .forEach(el => {
            el.innerText = currentUser.points || 0;
        });

    updateDailyStatus();
}

// ---------------- DAILY CLAIM ----------------
async function claimDaily() {

    if (!currentUser) return;

    try {

        const res = await fetch(`${API_URL}/daily`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                telegramId: currentUser.telegramId
            })
        });

        const data = await res.json();

        alert(data.message);

        if (data.user) {

            currentUser = data.user;
            updateUI();

            if (window.Telegram?.WebApp) {
                Telegram.WebApp.HapticFeedback.notificationOccurred("success");
            }
        }

    } catch (err) {

        console.log(err);
        alert("Daily reward failed");
    }
}

// ---------------- INVITE FRIENDS ----------------
function inviteFriends() {

    if (!currentUser) return;

    const botUsername = "Myatt_205bot";

    const refLink =
        `https://t.me/${botUsername}?start=${currentUser.telegramId}`;

    const shareText =
        `Join Myat Digital Shop and earn rewards!\n${refLink}`;

    Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`
    );
}

// ---------------- WITHDRAW ----------------
async function withdraw() {

    if (!currentUser) return;

    const wallet = prompt("Enter wallet address");
    if (!wallet) return;

    const points = prompt("Enter withdraw points");
    if (!points) return;

    try {

        const res = await fetch(`${API_URL}/withdraw`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                telegramId: currentUser.telegramId,
                wallet,
                points
            })
        });

        const data = await res.json();

        alert(data.message);

        if (data.user) {
            currentUser = data.user;
            updateUI();
        }

    } catch (err) {
        console.log(err);
        alert("Withdraw failed");
    }
}

// ---------------- LEADERBOARD ----------------
async function loadLeaderboard() {

    try {

        const res = await fetch(`${API_URL}/leaderboard`);
        const users = await res.json();

        const leaderboard =
            document.getElementById("leaderboard");

        if (!leaderboard) return;

        let html = `
            <div class="card">
                <h3>🏆 Leaderboard</h3>
            </div>
        `;

        users.forEach((u, index) => {

            html += `
                <div class="card">
                    <div class="task-box">
                        <span>#${index + 1} ${u.name}</span>
                        <span>${u.points} pts</span>
                    </div>
                </div>
            `;
        });

        leaderboard.innerHTML = html;

    } catch (err) {
        console.log(err);
    }
}

// ---------------- DAILY STATUS (✔ + COUNTDOWN) ----------------
function updateDailyStatus() {

    const btns = document.querySelectorAll(".task-box button");

    const now = new Date();

    const last = currentUser?.lastClaim
        ? new Date(currentUser.lastClaim)
        : null;

    let claimedToday = false;

    if (last) {
        claimedToday =
            last.getDate() === now.getDate() &&
            last.getMonth() === now.getMonth() &&
            last.getFullYear() === now.getFullYear();
    }

    btns.forEach(btn => {

        if (btn.innerText.includes("Claim")) {

            if (claimedToday) {

                btn.innerHTML = "✔ Claimed";
                btn.disabled = true;

                startCountdown(btn, last);
            }
        }
    });
}

// ---------------- COUNTDOWN ----------------
function startCountdown(btn, lastTime) {

    if (!lastTime) return;

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {

        const now = new Date();

        const nextReset = new Date(lastTime);
        nextReset.setDate(nextReset.getDate() + 1);
        nextReset.setHours(0, 0, 0, 0);

        const diff = nextReset - now;

        if (diff <= 0) {

            btn.innerHTML = "Claim";
            btn.disabled = false;

            clearInterval(countdownInterval);
            return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);

        btn.innerHTML = `⏳ ${h}h ${m}m ${s}s`;

    }, 1000);
}

// ---------------- START ----------------
login();
loadLeaderboard();
