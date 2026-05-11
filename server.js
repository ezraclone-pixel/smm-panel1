const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
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
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("MongoDB Connected");
})
.catch((err) => {
    console.log("MongoDB Error:", err);
});

// ---------------- USER MODEL ----------------
const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },

    balance: {
        type: Number,
        default: 0
    },

    lastClaim: {
        type: Date,
        default: null
    }
});

const User = mongoose.model("User", userSchema);

// ---------------- GET USER ----------------
app.post("/get-user", async (req, res) => {

    try {

        const { userId } = req.body;

        let user = await User.findOne({ userId });

        if (!user) {

            user = new User({
                userId
            });

            await user.save();
        }

        res.json({
            success: true,
            balance: user.balance,
            lastClaim: user.lastClaim
        });

    } catch (err) {

        console.log("GET USER ERROR:", err);

        res.json({
            success: false,
            message: "Server Error"
        });

    }

});

// ---------------- DAILY CLAIM ----------------
app.post("/daily-claim", async (req, res) => {

    try {

        const { userId } = req.body;

        let user = await User.findOne({ userId });

        if (!user) {

            user = new User({
                userId
            });
        }

        const now = new Date();

        // 24 HOURS
        if (user.lastClaim) {

            const diff = now - user.lastClaim;

            const cooldown = 24 * 60 * 60 * 1000;

            if (diff < cooldown) {

                return res.json({
                    success: false,
                    message: "Already Claimed Today"
                });

            }

        }

        // ADD 500 POINTS
        user.balance += 500;

        user.lastClaim = now;

        await user.save();

        res.json({
            success: true,
            balance: user.balance
        });

    } catch (err) {

        console.log("CLAIM ERROR:", err);

        res.json({
            success: false,
            message: "Server Error"
        });

    }

});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
});
