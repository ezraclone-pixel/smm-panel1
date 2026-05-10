const tg = window.Telegram.WebApp;
tg.expand();

// ---------------- USER ----------------
const user = tg.initDataUnsafe?.user;
const userId = user?.id || "guest_" + Math.floor(Math.random() * 99999);

// ---------------- STORAGE ----------------
let data = {
    points: 0,
    lastDaily: null
};

const key = "myat_shop_" + userId;

// load saved data
function loadData() {
    const saved = localStorage.getItem(key);
    if (saved) {
        data = JSON.parse(saved);
    }
}

// save data
function saveData() {
    localStorage.setItem(key, JSON.stringify(data));
}

// ---------------- UI UPDATE ----------------
function updateUI() {
    const walletBalance = document.querySelector("#wallet .balance-card h1");
    const rankPoints = document.querySelector(".user-rank-card .rank-points div");

    if (walletBalance) walletBalance.innerText = data.points;
    if (rankPoints) rankPoints.innerText = data.points;
}

// ---------------- HAPTIC ----------------
function haptic() {
    try {
        tg.HapticFeedback.impactOccurred("medium");
    } catch (e) {}
}

// ---------------- DAILY REWARD ----------------
function claimDaily() {
    const now = new Date().getTime();

    if (data.lastDaily && now - data.lastDaily < 86400000) {
        tg.showAlert("Daily reward already claimed today!");
        return;
    }

    data.points += 500;
    data.lastDaily = now;

    saveData();
    updateUI();

    tg.showAlert("+500 Points Added!");
    haptic();
}

// ---------------- JOIN CHANNEL ----------------
function joinChannel() {
    data.points += 2000;
    saveData();
    updateUI();

    window.open("https://t.me/Myat_2055", "_blank");
    tg.showAlert("+2000 Points Added!");
    haptic();
}

// ---------------- INVITE FRIENDS ----------------
function inviteFriends() {
    const link = `https://t.me/Myatt_205bot?start=${userId}`;
    navigator.clipboard.writeText(link);

    tg.showAlert("Invite link copied!");
    haptic();
}

// ---------------- BUTTON BINDING ----------------
function bindButtons() {
    const buttons = document.querySelectorAll(".item-card");

    if (buttons.length >= 1) {
        buttons[0].querySelector("button").onclick = claimDaily;
    }

    if (buttons.length >= 2) {
        buttons[1].querySelector("button").onclick = joinChannel;
    }

    if (buttons.length >= 3) {
        buttons[2].querySelector("button").onclick = inviteFriends;
    }
}

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    updateUI();
    bindButtons();
});
