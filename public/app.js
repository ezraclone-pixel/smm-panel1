const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;

const API_URL = "https://smm-panel1.onrender.com";

let currentUser = null;

// ---------------- LOGIN ----------------
async function login() {

    if (!user) return;

    const startParam = tg.initDataUnsafe?.start_param;

    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            telegramId: String(user.id),
            name: user.first_name,
            ref: startParam || null
        })
    });

    currentUser = await res.json();

    updateUI();
}

function updateUI() {

    if (!currentUser) return;

    document.querySelectorAll(".balance").forEach(el => {
        el.innerText = currentUser.points || 0;
    });
}

// ---------------- DAILY ----------------
async function claimDaily() {

    if (!currentUser) return;

    const res = await fetch(`${API_URL}/daily`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            telegramId: currentUser.telegramId
        })
    });

    const data = await res.json();

    alert(data.message);

    if (data.user) {
        currentUser = data.user;
        updateUI();
    }
}

// ---------------- WITHDRAW ----------------
async function withdraw() {

    const wallet = prompt("Wallet");
    const points = prompt("Points");

    const res = await fetch(`${API_URL}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            telegramId: currentUser.telegramId,
            wallet,
            points
        })
    });

    const data = await res.json();
    alert(data.message);
}

// ---------------- LEADERBOARD ----------------
async function loadLeaderboard() {

    const res = await fetch(`${API_URL}/leaderboard`);
    const users = await res.json();

    const el = document.getElementById("leaderboard");

    let html = `<div class="card"><h3>🏆 Leaderboard</h3></div>`;

    users.forEach((u, i) => {
        html += `
            <div class="card">
                #${i+1} ${u.name} - ${u.points}
            </div>
        `;
    });

    el.innerHTML = html;
}

// ---------------- GLOBAL FIX ----------------
window.claimDaily = claimDaily;
window.withdraw = withdraw;

// ---------------- START ----------------
login();
loadLeaderboard();
