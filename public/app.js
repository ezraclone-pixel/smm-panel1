const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;

const API_URL = "https://smm-panel1.onrender.com";

let balance = 0;

// ---------------- HAPTIC ----------------

// ---------------- LOAD USER ----------------
async function loginUser() {

    if (!user) {
        alert("Open from Telegram Bot");
        return;
    }

    try {

        const ref = new URLSearchParams(window.location.search).get("ref");

        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: user.id,
                username: user.username || user.first_name,
                referrer: ref || null
            })
        });

        const data = await res.json();

        balance = data.points || 0;

        updateBalance();

    } catch (err) {
        console.log(err);
    }
}

// ---------------- UPDATE BALANCE ----------------
function updateBalance() {

    const balanceText = document.querySelector(".balance-card h1");

    if (balanceText) {
        balanceText.innerText = balance.toLocaleString();
    }

    const rankPoint = document.querySelector(".user-rank-card .rank-points");

    if (rankPoint) {
        rankPoint.innerText = balance.toLocaleString();
    }
}

// ---------------- DAILY CLAIM ----------------
async function claimDaily(button) {

    try {

        const res = await fetch(`${API_URL}/daily`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                telegramId: user.id
            })
        });

        const data = await res.json();

        if (data.success) {

            balance = data.points;

            document.querySelector(".balance-card h1").innerText =
                balance.toLocaleString();

            tg.showAlert("✅ +500 Points Claimed");

            button.innerText = "Claimed";
            button.disabled = true;

        } else {

            tg.showAlert(data.message || "Already claimed");
        }

    } catch (err) {

        console.log(err);

        alert("Server Error");
    }
}


// ---------------- INVITE ----------------
function inviteFriends() {

    haptic();

    const link = `https://t.me/Myatt_205bot?start=${user.id}`;

    window.open(
        `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join Myat Digital Shop and earn rewards!")}`
    );
}

// ---------------- JOIN CHANNEL ----------------
function joinChannel() {

    haptic();

    window.open("https://t.me/Myat_2055");

    tg.showAlert("✅ Channel Joined");
}

// ---------------- PAGE ----------------
function showPage(pageId, element) {

    haptic();

    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
    });

    document.getElementById(pageId).style.display = 'flex';

    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });

    element.classList.add('active');
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

    document.getElementById('countdown').innerText =
        `${days}D : ${hours.toString().padStart(2, '0')}H : ${mins.toString().padStart(2, '0')}M : ${secs.toString().padStart(2, '0')}S`;
}

setInterval(updateCountdown, 1000);

updateCountdown();

loginUser();
