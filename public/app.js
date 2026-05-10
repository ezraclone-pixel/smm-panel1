const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user || {
    id: Date.now(),
    first_name: "Guest"
};

const API = "https://smm-panel1.onrender.com";

// ---------------- HAPTIC ----------------
function haptic() {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred("medium");
    }
}

// ---------------- PAGE ----------------
function showPage(pageId, element) {
    haptic();

    document.querySelectorAll(".page").forEach(p => {
        p.style.display = "none";
    });

    document.getElementById(pageId).style.display = "flex";

    document.querySelectorAll(".nav-item").forEach(nav => {
        nav.classList.remove("active");
    });

    if (element) {
        element.classList.add("active");
    }
}

// ---------------- COUNTDOWN ----------------
function updateCountdown() {
    const now = new Date();

    const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
    );

    const diff = end - now;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const hours = Math.floor(
        (diff / (1000 * 60 * 60)) % 24
    );

    const mins = Math.floor(
        (diff / (1000 * 60)) % 60
    );

    const secs = Math.floor(
        (diff / 1000) % 60
    );

    const el = document.getElementById("countdown");

    if (el) {
        el.innerText =
            `${days}D : ` +
            `${hours.toString().padStart(2, "0")}H : ` +
            `${mins.toString().padStart(2, "0")}M : ` +
            `${secs.toString().padStart(2, "0")}S`;
    }
}

setInterval(updateCountdown, 1000);
updateCountdown();

// ---------------- LOAD WALLET ----------------
async function loadWallet() {

    try {

        const res = await fetch(`${API}/user/${user.id}`);

        const data = await res.json();

        const balanceEl = document.querySelector(".balance-card h1");

        if (balanceEl) {
            balanceEl.innerText = data.points || 0;
        }

        const rankPoints = document.querySelector(".user-rank-card .rank-points");

        if (rankPoints) {
            rankPoints.innerText = data.points || 0;
        }

    } catch (err) {
        console.log(err);
    }
}

// ---------------- DAILY CLAIM ----------------
async function claimDailyReward() {

    haptic();

    try {

        const res = await fetch(`${API}/claim`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: user.id,
                name: user.first_name
            })
        });

        const data = await res.json();

        alert(data.msg);

        loadWallet();

    } catch (err) {

        alert("Server Error");

        console.log(err);
    }
}

// ---------------- WITHDRAW ----------------
async function withdrawPoints() {

    haptic();

    const amount = prompt("Withdraw Points:");

    if (!amount) return;

    try {

        const res = await fetch(`${API}/withdraw`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: user.id,
                amount: parseInt(amount)
            })
        });

        const data = await res.json();

        alert(data.success ? "Withdraw Requested" : data.msg);

        loadWallet();

    } catch (err) {

        alert("Withdraw Failed");

        console.log(err);
    }
}

// ---------------- INVITE ----------------
function inviteFriends() {

    haptic();

    const bot = "Myatt_205bot";

    const link =
        `https://t.me/${bot}?startapp=${user.id}`;

    tg.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(link)}`
    );
}

// ---------------- JOIN CHANNEL ----------------
function joinChannel() {

    haptic();

    tg.openTelegramLink("https://t.me/Myat_2055");
}

// ---------------- SHOP ----------------
function openShop() {

    haptic();

    const navs = document.querySelectorAll(".nav-item");

    showPage("shop", navs[1]);
}

// ---------------- START ----------------
window.onload = () => {

    loadWallet();

    const dailyBtn = document.querySelectorAll(".claim-btn")[0];

    if (dailyBtn) {
        dailyBtn.onclick = claimDailyReward;
    }

    const joinBtn = document.querySelectorAll(".claim-btn")[1];

    if (joinBtn) {
        joinBtn.onclick = joinChannel;
    }

    const inviteBtn = document.querySelectorAll(".claim-btn")[2];

    if (inviteBtn) {
        inviteBtn.onclick = inviteFriends;
    }

    const shopBtn = document.querySelectorAll(".claim-btn")[3];

    if (shopBtn) {
        shopBtn.onclick = openShop;
    }

    const withdrawBtn = document.querySelector(".btn-blue");

    if (withdrawBtn) {
        withdrawBtn.onclick = withdrawPoints;
    }
};
