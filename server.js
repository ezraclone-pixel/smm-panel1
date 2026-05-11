const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());

// STATIC FILES
app.use(express.static("public"));

// HOME ROUTE FIX
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// ---------------- MONGODB ----------------
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
})
.catch((err) => {
    console.log(err);
});

// ---------------- USER MODEL ----------------
const userSchema = new mongoose.Schema({
    telegramId: String,
    name: String,
    points: {
        type: Number,
        default: 0
    },
    referredBy: {
        type: String,
        default: null
    },
    lastClaim: {
        type: Date,
        default: null
    }
});

const User = mongoose.model("User", userSchema);

// ---------------- ORDER MODEL ----------------
const orderSchema = new mongoose.Schema({
    telegramId: String,
    product: String,
    price: Number,
    status: {
        type: String,
        default: "Pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.model("Order", orderSchema);

// ---------------- WITHDRAW MODEL ----------------
const withdrawSchema = new mongoose.Schema({
    telegramId: String,
    wallet: String,
    points: Number,
    status: {
        type: String,
        default: "Pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Withdraw = mongoose.model("Withdraw", withdrawSchema);

// ---------------- LOGIN + REFERRAL ----------------
app.post("/login", async (req, res) => {

    try {

        const { telegramId, name, ref } = req.body;

        let user = await User.findOne({ telegramId });

        // CREATE USER
        if (!user) {

            user = await User.create({
                telegramId,
                name,
                points: 0,
                referredBy: ref || null
            });

            // REFERRAL BONUS
            if (ref && ref !== telegramId) {

                const refUser =
                    await User.findOne({
                        telegramId: ref
                    });

                if (refUser) {

                    refUser.points += 2000;

                    await refUser.save();
                }
            }
        }

        res.json(user);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });
    }
});

// ---------------- DAILY CLAIM ----------------
app.post("/daily", async (req, res) => {

    try {

        const { telegramId } = req.body;

        const user = await User.findOne({ telegramId });

        if (!user) {
            return res.json({ message: "User not found" });
        }

        const now = new Date();

        // 🌙 MIDNIGHT RESET CHECK
        const last = user.lastClaim;

        if (last) {
            const lastDate = new Date(last);

            if (
                lastDate.getDate() === now.getDate() &&
                lastDate.getMonth() === now.getMonth() &&
                lastDate.getFullYear() === now.getFullYear()
            ) {
                return res.json({
                    message: "Already claimed today",
                    alreadyClaimed: true,
                    user
                });
            }
        }

        // 💰 REWARD
        user.points += 1000;
        user.lastClaim = now;

        await user.save();

        res.json({
            message: "Daily reward claimed",
            alreadyClaimed: false,
            user
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------- BUY PRODUCT ----------------
app.post("/buy", async (req, res) => {

    try {

        const {
            telegramId,
            product,
            price
        } = req.body;

        const user =
            await User.findOne({ telegramId });

        if (!user) {

            return res.json({
                message: "User not found"
            });
        }

        if (user.points < price) {

            return res.json({
                message: "Not enough points"
            });
        }

        user.points -= price;

        await user.save();

        await Order.create({
            telegramId,
            product,
            price
        });

        res.json({
            message: "Order successful",
            user
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });
    }
});

// ---------------- WITHDRAW ----------------
app.post("/withdraw", async (req, res) => {

    try {

        const {
            telegramId,
            wallet,
            points
        } = req.body;

        const user =
            await User.findOne({ telegramId });

        if (!user) {

            return res.json({
                message: "User not found"
            });
        }

        if (user.points < points) {

            return res.json({
                message: "Insufficient points"
            });
        }

        // ✅ CREATE PENDING REQUEST ONLY
        await Withdraw.create({
            telegramId,
            wallet,
            points,
            status: "Pending"
        });

        res.json({
            message: "Withdraw request submitted"
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });
    }
});
// ---------------- APPROVE WITHDRAW ----------------
app.post("/approve-withdraw", async (req, res) => {

    try {

        const { withdrawId } = req.body;

        const withdraw =
            await Withdraw.findById(withdrawId);

        if (!withdraw) {

            return res.json({
                message: "Withdraw not found"
            });
        }

        if (withdraw.status === "Approved") {

            return res.json({
                message: "Already approved"
            });
        }

        const user =
            await User.findOne({
                telegramId: withdraw.telegramId
            });

        if (!user) {

            return res.json({
                message: "User not found"
            });
        }

        if (user.points < withdraw.points) {

            return res.json({
                message: "Insufficient user points"
            });
        }

        // ✅ NOW REMOVE POINTS
        user.points -= withdraw.points;

        await user.save();

        withdraw.status = "Approved";

        await withdraw.save();

        res.json({
            message: "Withdraw approved"
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });
    }
});

// ---------------- LEADERBOARD ----------------
app.get("/leaderboard", async (req, res) => {

    try {

        const users = await User.find()
        .sort({ points: -1 })
        .limit(20);

        res.json(users);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });
    }
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
