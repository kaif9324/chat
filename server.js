const express = require("express");
const http = require("http");
const cors = require("cors");
const passport = require("./config/passportConfig");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
require("./config/db");

// Routes
const auth_router = require("./routes/authRoutes");
const chatRouter = require("./routes/chatRoutes");

app.use(express.json());
app.use(cors());
app.use(passport.initialize());
app.use("/chatApp", auth_router);
app.use("/", chatRouter);

// Socket setup
const setupSocket = require("./Socket/chatSocket");
setupSocket(server);

// Start server
server.listen(5000, () => {
  console.log("Server running on port 5000");
});
