require("dotenv").config({ path: ".env" });
const express = require("express");
const argon2 = require("argon2");
const crypto = require("crypto");
require("./db");

const registerRouter = require("./routes/register")
const authRouters = require("./routes/auth")
const app = express();
const PORT = process.env.PORT || 8080;

app.use("/api",registerRouter);
app.use("/api",authRouters);

app.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
