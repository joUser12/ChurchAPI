const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
    try {
        const { name, place, password, role, gameType } = req.body;

        // Check if name already exists for given age
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.status(400).json({ error: "User with this name and age already exists" });
        }

        // Build new user data
        const newUserData = { name, place, role };

        if (role !== "player") {
            if (!password) {
                return res.status(400).json({ error: "Password is required for " + role });
            }
            newUserData.password = password;
        }

        // If role is organizer, add gameType field
        if (role === "organizer") {
            if (!gameType) {
                return res.status(400).json({ error: "gameType is required for organizers" });
            }
            newUserData.gameType = gameType;
        }

        // Create new user
        const user = new User(newUserData);
        console.log(user)
        await user.save();

        res.status(201).json({
            message: "User created successfully",
            userNumber: user.userNumber, // assuming userNumber is generated in schema
            user
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// login

router.post("/login", async (req, res) => {
    try {
        const { name, password } = req.body;

        // 1. Check user exists
        const user = await User.findOne({ name });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        // 2. Skip password check for players (since they don’t have one)
        if (user.role !== "player") {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Invalid password" });
            }
        }
        console.log(user);
        // 3. Prepare response object
        const responseUser = {
            userNumber: user.userNumber,
            name: user.name,
            place: user.place,
            role: user.role,
        };

        // 👉 Only organizers should see gameType
        if (user.role === "organizer") {
            responseUser.gameType = user.gameType;
        }

        // 4. Success
        res.json({
            message: "Login successful",
            user: responseUser
        });

    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
});



// READ (All)
router.get("/", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/player", async (req, res) => {
    try {
        const users = await User.find({ role: "player" });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// game point update:
router.put("/:userNumber/games/:gameName", async (req, res) => {
    const { userNumber, gameName } = req.params;
    const { points } = req.body; // new points value

    try {
        const updatedUser = await User.findOneAndUpdate(
            {
                userNumber: parseInt(userNumber),
                "games.gameName": gameName
            },
            {
                $set: { "games.$.points": points }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User or game not found" });
        }

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// search key 

router.get("/search/:value", async (req, res) => {
    const { value } = req.params;

    try {
        let filter = { role: "player" }; // ✅ Always include only players

        if (!isNaN(value)) {
            // If value is a number → search by userNumber
            filter.userNumber = parseInt(value);
        } else {
            // Otherwise → search by name (case-insensitive)
            filter.name = { $regex: value, $options: "i" };
        }

        const users = await User.find(filter);
        res.json(users);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get("/players/sorted", async (req, res) => {
    try {
        const players = await User.aggregate([
            // Step 1: Match only players
            { $match: { role: "player" } },

            // Step 2: Calculate total points
            {
                $addFields: {
                    totalPoints: { $sum: "$games.points" }
                }
            },

            // Step 3: Sort by totalPoints (highest first)
            { $sort: { totalPoints: -1 } }
        ]);

        res.json(players);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




// READ (Single)
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE
router.put("/:id", async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE
router.delete("/:id", async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
