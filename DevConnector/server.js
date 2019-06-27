const express = require("express");
const connectdb = require("./config/db");
const app = express();

connectdb();

//Initialize express' bodyparser
app.use(express.json({ extended: false }));

app.get("/", (req, res) => res.send("API running"));

// define routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/authorization", require("./routes/api/authorization"));
app.use("/api/profiles", require("./routes/api/profiles"));
app.use("/api/posts", require("./routes/api/posts"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
