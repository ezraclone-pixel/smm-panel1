const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;

// ---------------- API URL ----------------
const API_URL = "https://smm-panel1.onrender.com";

// ---------------- CURRENT USER ----------------
let currentUser = null;

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

    // username
    const username =
        document.getElementById("username");

    if (username) {
        username.innerText =
            currentUser.name || "User";
    }

    // FIXED BALANCE UPDATE
    const balanceElements =
        document.querySelectorAll("#balance");

    balanceElements.forEach(el => {
        el.innerText =
            currentUser.points || 0;
    });
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

            // Telegram haptic
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

// ---------------- BUY PRODUCT ----------------
async function buyProduct(product, price) {

    if (!currentUser) return;

    try {

        const res = await fetch(`${API_URL}/buy`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                telegramId: currentUser.telegramId,
                product,
                price
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

        alert("Purchase failed");
    }
}

// ---------------- WITHDRAW ----------------
async function withdraw() {

    if (!currentUser) return;

    const wallet =
        prompt("Enter wallet address");

    if (!wallet) return;

    const points =
        prompt("Enter withdraw points");

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

// ---------------- LOAD LEADERBOARD ----------------
async function loadLeaderboard() {

    try {

        const res =
            await fetch(`${API_URL}/leaderboard`);

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

// ---------------- START ----------------
login();
loadLeaderboard();

