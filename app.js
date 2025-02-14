const app = require("./index");
const db = require("./db");

const PORT = process.env.PORT || 5000;

// Connect to database
db.connectToDb();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await db.disconnectDB();
  process.exit(0);
});
