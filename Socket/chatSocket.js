const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const userSchema = require("../module/userSchema");
const messages = require("../module/messages");

const onlineUsers = new Map(); // userId -> socket.id

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Middleware: JWT authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return socket.disconnect();

    jwt.verify(token, process.env.SECRATE_KEY, (err, decode) => {
      if (err) return next(new Error("Authentication error: Invalid token"));

      socket.userid = decode.userdata.id;
      socket.userUsername = decode.userdata.username;
      next();
    });
  });

  // Main socket logic
  io.on("connection", async (socket) => {
    const userId = socket.userid;
    if (!userId) return;

    socket.join(userId);
    onlineUsers.set(userId, socket.id);

    await userSchema.findByIdAndUpdate(userId, {
      online: true,
      lastSeen: null,
      typing: false,
    });

    // Notify others about this user's status
    socket.broadcast.emit("userStatusUpdate", {
      userId,
      online: true,
      lastSeen: null,
    });

    let disconnectionHandler = false;

    // Typing
    socket.on("typing", ({ senderId, receiverId }) => {
      socket.to(receiverId).emit("show_typing", { senderId });
    });

    socket.on("stop_typing", ({ senderId, receiverId }) => {
      socket.to(receiverId).emit("hide_typing", { senderId });
    });

    // Send message
    socket.on("private_message", async ({ senderid, recieverid, msg }) => {
      const newMsg = new messages({ sender: senderid, receiver: recieverid, msg });
      const saveMsg = await newMsg.save();

      io.to(recieverid).emit("receive_msg", {
        _id: saveMsg._id, senderid, recieverid, msg, time: saveMsg.createdAt,
      });
      io.to(senderid).emit("receive_msg", {
        _id: saveMsg._id, senderid, recieverid, msg, time: saveMsg.createdAt,
      });
    });

    // Delete message
    socket.on("deleteMsg", async (msgId) => {
      try {
        await messages.findByIdAndDelete(msgId);
        io.emit("messageDeleted", msgId);
      } catch (err) {
        console.log(err);
      }
    });

    // Delete for me
    socket.on("deleteForme", async ({ msgId, userId }) => {
      const response = await messages.findByIdAndUpdate(msgId, {
        $addToSet: { deletedFor: userId },
      });
      io.to(userId).emit("messageDeletedForMe", response._id);
    });

    // Handle logout
    socket.on("logout", async () => {
      if (disconnectionHandler) return;
      disconnectionHandler = true;

      onlineUsers.delete(userId);
      const lastSeen = Date.now();

      await userSchema.findByIdAndUpdate(userId, {
        online: false,
        lastSeen,
      });

      socket.broadcast.emit("disconnectuser", {
        userid: userId,
        online: false,
        lastSeen,
      });

      socket.disconnect();
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      if (disconnectionHandler) return;
      disconnectionHandler = true;

      onlineUsers.delete(userId);
      const lastSeen = Date.now();

      await userSchema.findByIdAndUpdate(userId, {
        online: false,
        lastSeen,
      });

      socket.broadcast.emit("disconnectuser", {
        userid:userId,
        online: false,
        lastSeen,
      });
    });
  });
}

module.exports = setupSocket;
