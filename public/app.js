const API_URL = "https://smm-panel1.onrender.com";

const tg = window.Telegram.WebApp;
tg.expand();

// ---------------- USER ID ----------------
const userId = tg.initDataUnsafe?.user?.id?.toString() || "guest_user";

// ---------------- PAGE SWITCH ----------------
function showPage(pageId, element) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    document.getElementById(pageId).classList.add("active-page");

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    element.classList.add("active");
}

// ---------------- LOAD USER ----------------
async function loadUser() {

    try {

        const res = await fetch(`${API_URL}/get-user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId
            })
        });

        const data = await res.json();

        if (data.success) {

            document.querySelector(".balance-card h1").innerText =
                data.balance;

        }

    } catch (err) {

        console.log("Load User Error:", err);

    }
}

// ---------------- DAILY CLAIM ----------------
const claimBtn = document.querySelector(".claim-btn");

claimBtn.addEventListener("click", async () => {

    try {

        claimBtn.innerText = "Loading...";
        claimBtn.disabled = true;

        const res = await fetch(`${API_URL}/daily-claim`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId
            })
        });

        const data = await res.json();

        if (data.success) {

            document.querySelector(".balance-card h1").innerText =
                data.balance;

            claimBtn.innerText = "Claimed";

            alert("500 Points Added!");

        } else {

            alert(data.message || "Server Error");

            claimBtn.innerText = "Claim";
            claimBtn.disabled = false;

        }

    } catch (err) {

        console.log("Claim Error:", err);

        alert("Server Error");

        claimBtn.innerText = "Claim";
        claimBtn.disabled = false;

    }

});

// ---------------- COUNTDOWN ----------------
function updateCountdown() {

    const endDate = new Date("2026-12-31T23:59:59").getTime();

    const now = new Date().getTime();

    const distance = endDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));

    const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) /
        (1000 * 60 * 60)
    );

    const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) /
        (1000 * 60)
    );

    const seconds = Math.floor(
        (distance % (1000 * 60)) / 1000
    );

    document.getElementById("countdown").innerText =
        `${days}D : ${hours}H : ${minutes}M : ${seconds}S`;
}

setInterval(updateCountdown, 1000);

updateCountdown();
loadUser();
