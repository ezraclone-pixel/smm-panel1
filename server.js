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
            return res.json({
                message: "User not found"
            });
        }

        const now = new Date();

        if (user.lastClaim) {

            const diff =
                now - new Date(user.lastClaim);

            const hours =
                diff / (1000 * 60 * 60);

            if (hours < 24) {

                return res.json({
                    message: "Already claimed today"
                });
            }
        }

        user.points += 1000;

        user.lastClaim = now;

        await user.save();

        res.json({
            message: "Daily reward claimed",
            user
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });
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

        user.points -= points;

        await user.save();

        await Withdraw.create({
            telegramId,
            wallet,
            points
        });

        res.json({
            message: "Withdraw submitted",
            user
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