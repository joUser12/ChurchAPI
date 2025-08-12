const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

const URL="mongodb+srv://joysundaran15:ATi9QiDeoXraQI7i@cluster0.feh3a3d.mongodb.net/ChurchDB?retryWrites=true&w=majority"

mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas!"))
  .catch(err => console.error("Connection error:", err));

// Routes

app.use("/api/users", userRoutes);

// Start Server
app.listen(5000, () => {
    console.log("🚀 Server running on http://localhost:5000");
});
