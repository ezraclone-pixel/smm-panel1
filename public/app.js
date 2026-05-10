const tg = window.Telegram.WebApp;
tg.expand();

const API_URL = "https://smm-panel1.onrender.com"; // 🔁 Render URL ထည့်

let user = tg.initDataUnsafe?.user;
let userId = user?.id;

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", () => {
    if (!userId) {
        tg.showAlert("Telegram user not found!");
        return;
    }

    loginUser();
    setupEarnButtons();
});

// ---------------- LOGIN USER ----------------
async function loginUser() {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                telegramId: userId,
                username: user.username || "unknown"
            })
        });

        const data = await res.json();

        if (data.success) {
            updateBalance(data.user.points);
        }
    } catch (err) {
        console.log("Login error:", err);
    }
}

// ---------------- UPDATE BALANCE ----------------
function updateBalance(points) {
    const balanceEl = document.querySelector(".balance-card h1");
    if (balanceEl) {
        balanceEl.innerText = points;
    }
}

// ---------------- DAILY REWARD ----------------
async function claimDaily() {
    try {
        const res = await fetch(`${API_URL}/daily-claim`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramId: userId })
        });

        const data = await res.json();

        if (data.success) {
            tg.showAlert(`+${data.reward} Points ရပြီ 🎉`);
            updateBalance(data.points);
        } else {
            tg.showAlert(data.message || "Already claimed");
        }
    } catch (err) {
        tg.showAlert("Server error");
    }
}

// ---------------- WITHDRAW ----------------
async function withdraw() {
    try {
        const res = await fetch(`${API_URL}/withdraw`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramId: userId })
        });

        const data = await res.json();

        tg.showAlert(data.message);
    } catch (err) {
        tg.showAlert("Withdraw error");
    }
}

// ---------------- REFERRAL LINK ----------------
function getReferralLink() {
    return `https://t.me/Myatt_205bot?start=${userId}`;
}

// ---------------- SHOP ACTION (placeholder) ----------------
function buyProduct(productId) {
    fetch(`${API_URL}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            telegramId: userId,
            productId
        })
    })
    .then(res => res.json())
    .then(data => tg.showAlert(data.message))
    .catch(() => tg.showAlert("Buy error"));
}

// ---------------- EARN BUTTONS CONNECT ----------------
function setupEarnButtons() {
    const cards = document.querySelectorAll(".item-card");

    // 0 = Daily Reward
    if (cards[0]) {
        cards[0].querySelector("button").onclick = () => {
            tg.HapticFeedback.impactOccurred("medium");
            claimDaily();
        };
    }

    // 1 = Join Channel
    if (cards[1]) {
        cards[1].querySelector("button").onclick = () => {
            tg.HapticFeedback.impactOccurred("medium");
            window.open("https://t.me/Myat_2055", "_blank");
        };
    }

    // 2 = Invite Friends
    if (cards[2]) {
        cards[2].querySelector("button").onclick = () => {
            tg.HapticFeedback.impactOccurred("medium");
            const link = getReferralLink();
            tg.showAlert("Referral Link copied:\n" + link);
            navigator.clipboard.writeText(link);
        };
    }

    // 3 = Shop
    if (cards[3]) {
        cards[3].querySelector("button").onclick = () => {
            tg.HapticFeedback.impactOccurred("medium");
            showPage("shop", document.querySelectorAll(".nav-item")[1]);
        };
    }
}

// ---------------- GLOBAL FUNCTIONS ----------------
window.claimDaily = claimDaily;
window.withdraw = withdraw;
window.buyProduct = buyProduct;
