require("dotenv").config({ path: ".env" });
const express = require("express");
const argon2 = require("argon2");
const crypto = require("crypto");
// require("./db");
require("./connectMysql");

const registerRouter = require("./routes/register");
const authRouters = require("./routes/auth");
const allRouter = require("./routes/routers");
const app = express();
const PORT = process.env.PORT || 8080;

// app.use(registerRouter);
app.use(allRouter);

app.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
