const express = require("express");
const app = express();
app.use(express.json());

app.use((req,res, next) => {
    console.log("Middleware");
    res.status(200).json({ message: "Hello from express" });
    return;
});

module.exports = { app };
