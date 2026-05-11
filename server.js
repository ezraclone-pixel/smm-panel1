const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Telegraf } = require("telegraf");
require("dotenv").config();

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// HOME
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// ---------------- MONGODB ----------------
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ---------------- BOT ----------------
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply("👋 Welcome!", {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: "🚀 Open App",
                    web_app: {
                        url: "https://smm-panel1.onrender.com"
                    }
                }]
            ]
        }
    });
});

bot.launch();
console.log("Bot Started");

// ---------------- MODELS ----------------
const userSchema = new mongoose.Schema({
    telegramId: String,
    name: String,
    points: { type: Number, default: 0 },
    referredBy: { type: String, default: null },
    lastClaim: { type: Date, default: null }
});
const User = mongoose.model("User", userSchema);

const orderSchema = new mongoose.Schema({
    telegramId: String,
    product: String,
    price: Number,
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", orderSchema);
const withdrawSchema = new mongoose.Schema({
    telegramId: String,
    wallet: String,
    points: Number,
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now }
});

const Withdraw = mongoose.model("Withdraw", withdrawSchema);
// ---------------- LOGIN ----------------
app.post("/login", async (req, res) => {
    try {
        const { telegramId, name, ref } = req.body;

        let user = await User.findOne({ telegramId });

        if (!user) {
            user = await User.create({
                telegramId,
                name,
                referredBy: ref || null
            });

            if (ref && ref !== telegramId) {
                const refUser = await User.findOne({ telegramId: ref });
                if (refUser) {
                    refUser.points += 2000;
                    await refUser.save();
                }
            }
        }

        return res.json({
            telegramId: user.telegramId,
            name: user.name,
            points: user.points,
            lastClaim: user.lastClaim,
            referredBy: user.referredBy
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}); // ✅ THIS FIXES EVERYTHING

// ---------------- DAILY ----------------
app.post("/daily", async (req, res) => {
    try {
        const { telegramId } = req.body;

        const user = await User.findOne({ telegramId });
        if (!user) {
            return res.json({ message: "User not found", user: null });
        }

        const now = new Date();

        // safe date compare (UTC-based, no timezone bug)
        const isSameDay = (d1, d2) => {
            return (
                d1.getUTCFullYear() === d2.getUTCFullYear() &&
                d1.getUTCMonth() === d2.getUTCMonth() &&
                d1.getUTCDate() === d2.getUTCDate()
            );
        };

        if (user.lastClaim && isSameDay(new Date(user.lastClaim), now)) {
            return res.json({
                message: "Already claimed today",
                user
            });
        }

        user.points = (user.points || 0) + 1000;
        user.lastClaim = now;

        await user.save();

        return res.json({
            message: "Daily reward claimed",
            user
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------- WITHDRAW ----------------
app.post("/withdraw", async (req, res) => {
    try {
        const { telegramId, wallet, points } = req.body;

        const amount = parseInt(points, 10);
if (isNaN(amount) || amount <= 0) {
    return res.json({ message: "Invalid points" });
}

        await Withdraw.create({
            telegramId,
            wallet,
            points: amount,
            status: "Pending"
        });

        res.json({ message: "Withdraw request submitted" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ---------------- GET WITHDRAW LIST (ADMIN) ----------------
app.get("/withdraws", async (req, res) => {
    try {
        const data = await Withdraw.find().sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------- APPROVE WITHDRAW (ADMIN SECURE) ----------------
app.post("/approve-withdraw", async (req, res) => {
    try {

        // 🔐 SIMPLE ADMIN KEY CHECK
        const { adminKey, withdrawId } = req.body;

        if (adminKey !== process.env.ADMIN_KEY) {
            return res.json({ message: "Unauthorized" });
        }

        const w = await Withdraw.findById(withdrawId);
        if (!w) return res.json({ message: "Not found" });

        if (w.status === "Approved") {
            return res.json({ message: "Already approved" });
        }

        const user = await User.findOne({ telegramId: w.telegramId });
        if (!user) return res.json({ message: "User not found" });

        if (user.points < w.points) {
            return res.json({ message: "Insufficient points" });
        }

        user.points -= w.points;
        await user.save();

        w.status = "Approved";
        await w.save();

        res.json({ message: "Withdraw approved" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------- LEADERBOARD ----------------
app.get("/leaderboard", async (req, res) => {
    try {
        const users = await User.find({})
    .select("name points telegramId")
    .sort({ points: -1 })
    .limit(20);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------- START ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on " + PORT);
});
