const express = require("express");
const router = express.Router();
const User = require("../models/user");

// CREATE
// CREATE user
// router.post("/", async (req, res) => {
//     try {
//         const { name, age, role, } = req.body;

//         // Check if name already exists
//         const existingUser = await User.findOne({ name, age });
//         if (existingUser) {
//             return res.status(400).json({ error: "User with this name and age already exists" });
//         }

//         // Create new user
//         const user = new User({ name, age, role });
//         await user.save();

//           res.status(201).json({
//             message: "User created successfully",
//             userNumber: user.userNumber, // send userNumber directly
//             user: user // optional: send full user object
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });


router.post("/", async (req, res) => {
    try {
        const { name, age, role, gameType } = req.body;

        // Check if name already exists for given age
        const existingUser = await User.findOne({ name, age });
        if (existingUser) {
            return res.status(400).json({ error: "User with this name and age already exists" });
        }

        // Build new user data
        const newUserData = { name, age, role };

        // If role is organizer, add gameType field
        if (role === "organizer") {
            if (!gameType) {
                return res.status(400).json({ error: "gameType is required for organizers" });
            }
            newUserData.gameType = gameType;
        }

        // Create new user
        const user = new User(newUserData);
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
        let filter = {};

        if (!isNaN(value)) {
            // If the value is a number → search by userNumber
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
