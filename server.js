const express = require("express");
const app = express();
const db = require("./config/db");
const userSchema = require("./module/userSchema");
const passport = require("./config/passportConfig");
const cors = require("cors");
require("dotenv").config();
const { Server } = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const messages = require("./module/messages");
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// auth routes
const auth_router = require("./routes/authRoutes");
app.use("/chatApp", auth_router);

// chat routes
const chatRouter = require("./routes/chatRoutes");
const userStatus = require("./module/userStatus");
app.use("/", chatRouter);

// WebSocket server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map(); // userid -> socket.id

// Middleware to authenticate user with token
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log("token missing");
    return socket.disconnect();
  }
  jwt.verify(token, process.env.SECRATE_KEY, (err, decode) => {
    if (err) {
      console.log("Unauthorized connection:", err.message);
      return next(new Error("Authentication error: Invalid token"));
    }
    const userid = decode.userdata.id;
    const username = decode.userdata.username;
    socket.userid = userid;
    socket.userUsername = username;
    console.log("User authenticated:", userid, socket.id, username);
    next();
  });
});


io.on("connection", async (socket) => {
  const userId = socket.userid;
  if (userId) {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  }

  console.log(`Socket connected: ${socket.id} for user: ${userId}`);

  // Save the user as online
  onlineUsers.set(userId, socket.id);

  // Immediately broadcast updated statuses
  // broadcastUserStatuses();

  const response = await userSchema.findByIdAndUpdate(userId, {
    online: true,
    lastSeen :null,
    typing: false,
  }).exec();
  console.log("userSchema response:", response);

  onlineUsers.forEach((val, key) => {
    if (userId !== key) {
      socket.emit("userStatusUpdate", {
        userId:key,
        online: true,
        lastSeen: null,
      });
    }
  });

    socket.broadcast.emit("userStatusUpdate", {
    userId,
    online: true,
    lastSeen: null,
  });

  let disconnectionHandler= false;


    socket.on("logout",async () => {
      if(disconnectionHandler) return ;
      disconnectionHandler=true;

    console.log(`User logout: ${userId}`);

    onlineUsers.delete(userId);

    const lastSeen = Date.now();

    await userSchema.findByIdAndUpdate(userId,{
      online:false,
      lastSeen:lastSeen
    })


    // ✅ Send last seen before disconnect
    socket.broadcast.emit("userStatusUpdate", {
     userid: userId,
      online: false,
      lastSeen: lastSeen,
    });
    socket.disconnect();
  });




  socket.on("disconnect", async () => {
    if(disconnectionHandler) return;

    disconnectionHandler=true;


    console.log(`User disconnected: ${userId}, ${socket.userUsername}`);

    const isonline = onlineUsers.delete(userId);
    const lastseen =  Date.now()
    await userSchema.findByIdAndUpdate(userId,{
      online:false,
      lastSeen:lastseen
    })
    socket.broadcast.emit('userStatusUpdate',{
      userId,
      online:false,
      lastSeen:lastseen
    })

    console.log("is user online:-", isonline);

  });


  // typing status 
    socket.on('typing',({senderId,receiverId})=>{
      console.log({senderId,receiverId})
      socket.to(receiverId).emit("show_typing",{senderId});
    })

    // stop typing 
    socket.on("stop_typing",({senderId,receiverId})=>{
      
      socket.to(receiverId).emit('hide_typing',{senderId})
    })



  // typing status  end



  // Private message sending
  socket.on("private_message", async ({ senderid, recieverid, msg }) => {
    //  console.log("Test message received:", { _id, senderid, recieverid, msg, time });
    const New_msgs = new messages({
      sender: senderid,
      receiver: recieverid,
      msg,
    });

    const saveMsg = await New_msgs.save();

    // Add logs just before emitting the event
    console.log("Emitting receive_msg to sender:", senderid);
    console.log("Emitting receive_msg to receiver:", recieverid);
    io.to(recieverid).emit("receive_msg", {
      _id: saveMsg._id,
      senderid,
      recieverid,
      msg,
      time: saveMsg.createdAt,
    });

    io.to(senderid).emit("receive_msg", {
      _id: saveMsg._id,
      senderid,
      recieverid,
      msg,
      time: saveMsg.createdAt,
    });
  });

  // Deletion of messages
  socket.on("deleteMsg", async (msgId) => {
    try {
      await messages.findByIdAndDelete(msgId);
      io.emit("messageDeleted", msgId);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("deleteForme", async ({ msgId, userId }) => {
    const response = await messages.findByIdAndUpdate(msgId, {
      $addToSet: { deletedFor: userId },
    });

    io.to(userId).emit("messageDeletedForMe", response._id);
  });
});

server.listen(5000, () => {
  console.log("server running on port 5000");
});
