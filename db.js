const mongoose = require("mongoose");
const { DB_URI } = process.env;

mongoose.set("strictQuery", true);

mongoose
  .connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch((error) =>
    console.error(`Error in MongoDB connection: ${error.message}`)
  );

const db = mongoose.connection;

db.on("error", (error) => {
  console.error(`An error occurred: ${error.message}`);
  process.exit(1);
});

db.once("open", function () {
  console.log("Connected to database");
});

module.export = db;
