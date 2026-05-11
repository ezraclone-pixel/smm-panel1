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

// ---------------- HOME ----------------
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
            inline_keyboard: [[
                {
                    text: "🚀 Open App",
                    web_app: {
                        url: process.env.WEBAPP_URL
                    }
                }
            ]]
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

        res.json(user);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------- DAILY ----------------
app.post("/daily", async (req, res) => {
    try {
        const { telegramId } = req.body;

        const user = await User.findOne({ telegramId });
        if (!user) return res.json({ message: "User not found" });

        const now = new Date();
        const last = user.lastClaim ? new Date(user.lastClaim) : null;

        const claimedToday =
            last && last.toDateString() === now.toDateString();

        if (claimedToday) {
            return res.json({
                message: "Already claimed today",
                user
            });
        }

        user.points += 1000;
        user.lastClaim = now;

        await user.save();

        res.json({
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

        const amount = parseInt(points);

        if (!amount || amount <= 0) {
            return res.json({ message: "Invalid points" });
        }

        await Withdraw.create({
            telegramId,
            wallet,
            points: amount
        });

        res.json({ message: "Withdraw request submitted" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------- WITHDRAW LIST ----------------
app.get("/withdraws", async (req, res) => {
    const data = await Withdraw.find().sort({ createdAt: -1 });
    res.json(data);
});

// ---------------- APPROVE WITHDRAW ----------------
app.post("/approve-withdraw", async (req, res) => {
    try {
        const { adminKey, withdrawId } = req.body;

        if (adminKey !== process.env.ADMIN_KEY) {
            return res.json({ message: "Unauthorized" });
        }

        const w = await Withdraw.findById(withdrawId);
        if (!w) return res.json({ message: "Not found" });

        const user = await User.findOne({ telegramId: w.telegramId });
        if (!user) return res.json({ message: "User not found" });

        if (user.points < w.points) {
            return res.json({ message: "Insufficient points" });
        }

        user.points -= w.points;
        await user.save();

        w.status = "Approved";
        await w.save();

        res.json({ message: "Approved" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------- LEADERBOARD ----------------
app.get("/leaderboard", async (req, res) => {
    const users = await User.find({})
        .select("name points")
        .sort({ points: -1 })
        .limit(20);

    res.json(users);
});

// ---------------- START ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on " + PORT);
});
