// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//     userNumber: { type: Number, unique: true },
//     name:  { type: String, required: true },
//     age:   Number,
//     role:  { 
//         type: String, 
//         enum: ["admin", "player", "organiser"], 
//         default: "player" 
//     },
//     games: {
//         type: [
//             {
//                 gameName: { type: String, required: true },
//                 points: { type: Number, default: 0 }
//             }
//         ],
//         default: function () {
//             if (this.role === "player") {
//                 return [
//                     { gameName: "Game1", points: 0 },
//                     { gameName: "Game2", points: 0 },
//                     { gameName: "Game3", points: 0 },
//                     { gameName: "Game4", points: 0 },
//                     { gameName: "Game5", points: 0 }
//                 ];
//             }
//             return [];
//         }
//     }
// });

// // Auto-generate userNumber before saving
// userSchema.pre("save", async function (next) {
//     if (!this.userNumber) {
//         const lastUser = await this.constructor
//             .findOne()
//             .sort({ userNumber: -1 });

//         this.userNumber = lastUser ? lastUser.userNumber + 1 : 1;
//     }
//     next();
// });

// module.exports = mongoose.model("User", userSchema);


const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
// Counter Schema
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // sequence name
    seq: { type: Number, default: 0 }
});
const Counter = mongoose.model("Counter", counterSchema);

const userSchema = new mongoose.Schema({
    userNumber: { type: Number, unique: true },
    name: { type: String, required: true },
    place: { type: String, }, // new field
    password: { type: String, }, // new field
    gameType: { type: String, },
    role: {
        type: String,
        enum: ["admin", "player", "organizer",'reception'],
        default: "player"
    },
    games: {
        type: [
            {
                gameName: { type: String, required: true },
                points: { type: Number, default: 0 }
            }
        ],
        default: function () {
            if (this.role === "player") {
                return [
                    { gameName: "Game1", points: null },
                    { gameName: "Game2", points: null },
                    { gameName: "Game3", points: null },
                    { gameName: "Game4", points: null },
                    { gameName: "Game5", points: null }
                ];
            }
            return [];
        }
    }
});

// Pre-save hook for userNumber
userSchema.pre("save", async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: "userNumber" },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.userNumber = counter.seq;
        } catch (err) {
            return next(err);
        }
    }
    next();
});

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};


module.exports = mongoose.model("User", userSchema);
