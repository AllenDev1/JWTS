const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "yourdatabase", // Specify the database name here
});

db.connect(function (err) {
  if (err) throw err;
  console.log("Connected to MySQL database!");
});

module.exports = db;
