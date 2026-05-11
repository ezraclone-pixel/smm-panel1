const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;

// ---------------- API URL ----------------
const API_URL = "https://smm-panel1.onrender.com";

// ---------------- CURRENT USER ----------------
let currentUser = null;

// ---------------- LOGIN + REFERRAL ----------------
async function loginUser() {

    if (!user) {
        alert("Open inside Telegram");
        return;
    }

    try {

        const startParam =
            tg.initDataUnsafe?.start_param || null;

        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                telegramId: user.id,
                username: user.username || "",
                firstName: user.first_name || "",
                referralCode: startParam
            })
        });

        const data = await res.json();

        currentUser = data.user;

        updateUI();

        loadLeaderboard();

        loadOrders();

    } catch (err) {
        console.log(err);
        alert("Login failed");
    }
}

// ---------------- UPDATE UI ----------------
function updateUI() {

    if (!currentUser) return;

    document.getElementById("balance").innerText =
        currentUser.balance || 0;

    document.getElementById("walletBalance").innerText =
        currentUser.balance || 0;
}

// ---------------- CLAIM DAILY ----------------
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
        }

        tg.HapticFeedback.notificationOccurred("success");

    } catch (err) {
        console.log(err);
        alert("Claim failed");
    }
}

// ---------------- BUY PRODUCT ----------------
async function buyProduct(productName, price) {

    if (!currentUser) return;

    try {

        const res = await fetch(`${API_URL}/buy`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                telegramId: currentUser.telegramId,
                productName,
                price
            })
        });

        const data = await res.json();

        alert(data.message);

        if (data.user) {
            currentUser = data.user;
            updateUI();
        }

        loadOrders();

    } catch (err) {
        console.log(err);
        alert("Purchase failed");
    }
}

// ---------------- WITHDRAW ----------------
async function withdraw() {

    if (!currentUser) return;

    const amount = prompt("Enter amount");

    if (!amount) return;

    try {

        const res = await fetch(`${API_URL}/withdraw`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                telegramId: currentUser.telegramId,
                amount
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

// ---------------- INVITE FRIENDS ----------------
function inviteFriends() {

    if (!currentUser) return;

    const botUsername = "Myatt_205bot";

    const inviteLink =
        `https://t.me/${botUsername}?start=${currentUser.telegramId}`;

    const text =
        encodeURIComponent(
            `Join Myat Digital Shop & earn rewards!\n${inviteLink}`
        );

    window.open(
        `https://t.me/share/url?url=${inviteLink}&text=${text}`,
        "_blank"
    );
}

// ---------------- LOAD LEADERBOARD ----------------
async function loadLeaderboard() {

    try {

        const res = await fetch(`${API_URL}/leaderboard`);

        const data = await res.json();

        const board =
            document.getElementById("leaderboardData");

        board.innerHTML = "";

        data.forEach((u, index) => {

            board.innerHTML += `
                <div style="margin-bottom:10px;">
                    ${index + 1}. ${u.firstName} - ${u.balance} Coins
                </div>
            `;
        });

    } catch (err) {
        console.log(err);
    }
}

// ---------------- LOAD ORDERS ----------------
async function loadOrders() {

    if (!currentUser) return;

    try {

        const res = await fetch(
            `${API_URL}/orders/${currentUser.telegramId}`
        );

        const data = await res.json();

        const ordersDiv =
            document.getElementById("ordersData");

        if (!data.length) {
            ordersDiv.innerHTML = "No orders yet";
            return;
        }

        ordersDiv.innerHTML = "";

        data.forEach(order => {

            ordersDiv.innerHTML += `
                <div style="margin-bottom:10px;padding:10px;background:#334155;border-radius:10px;">
                    <b>${order.productName}</b><br>
                    ${order.price} Coins
                </div>
            `;
        });

    } catch (err) {
        console.log(err);
    }
}

// ---------------- START ----------------
loginUser();
