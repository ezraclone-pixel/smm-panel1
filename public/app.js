const tg = window.Telegram.WebApp;
tg.expand();

const API_URL = "https://smm-panel1.onrender.com";

let userId = null;
let userData = { balance: 0, referrals: 0 };

// ---------------- INIT ----------------
function init() {
    const user = tg.initDataUnsafe?.user;

    if (!user) {
        document.getElementById("userId").innerText = "Telegram not detected";
        return;
    }

    userId = user.id;
    document.getElementById("userId").innerText = userId;

    loginUser();
    loadLocal();
}

// ---------------- LOGIN ONLY (backend compatible) ----------------
async function loginUser() {
    try {
        await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({
                telegramId: userId
            })
        });

        // no extra API calls → safe with your backend
        loadLocal();

    } catch (e) {
        console.log(e);
    }
}

// ---------------- LOCAL UI (NO EXTRA API) ----------------
function loadLocal() {
    // fallback display (backend မလိုပဲ UI မပျက်အောင်)
    document.getElementById("balance").innerText = userData.balance;
    document.getElementById("refs").innerText = userData.referrals;

    document.getElementById("link").innerText =
        `https://t.me/Myatt_205bot?start=${userId}`;
}

// ---------------- COPY ----------------
function copy() {
    const text = document.getElementById("link").innerText;
    navigator.clipboard.writeText(text);
    tg.HapticFeedback.notificationOccurred("success");
    alert("Copied!");
}

// ---------------- SHARE ----------------
function share() {
    const link = document.getElementById("link").innerText;

    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=Join+and+earn+rewards`;

    window.open(url, "_blank");
}

// ---------------- REFRESH ----------------
function refresh() {
    loadLocal();
}

// ---------------- START ----------------
init();
