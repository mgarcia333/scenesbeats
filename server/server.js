import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

// Global crash protection
process.on('uncaughtException', (err) => {
  console.error('🔥 CRITICAL: Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🌊 CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [process.env.FRONTEND_URL, "http://127.0.0.1:5171", "http://localhost:5171"],
    credentials: true,
  }
});

const PORT = process.env.PORT || 5000;
const userSockets = new Map(); // userId -> set of socket IDs

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://127.0.0.1:5171", "http://localhost:5171"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

import authRoutes from "./routes/auth.js";
app.use("/api/auth", authRoutes);

import spotifyRoutes from "./routes/spotify.js";
app.use("/api/spotify", spotifyRoutes);

import recommendationRoutes from "./routes/recommendation.js";
app.use("/api/recommendation", recommendationRoutes);

import movieRoutes from "./routes/movieRoutes.js";
app.use("/api/movie", movieRoutes);


app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ScenesBeats API" });
});

// Internal endpoint for Laravel to trigger socket broadcasts
app.post("/api/internal/broadcast", (req, res) => {
  const { event, data } = req.body;
  if (!event || !data) {
    return res.status(400).json({ error: "Event and data required" });
  }

  console.log(`📣 Internal broadcast: ${event}`);

  // If data has a recipient_id, only send to that user
  if (data.recipient_id) {
    const socketIds = userSockets.get(String(data.recipient_id));
    if (socketIds) {
      socketIds.forEach(sid => io.to(sid).emit(event, data));
      console.log(`   Directed to user: ${data.recipient_id} (${socketIds.size} sockets)`);
    }
  } else if (data.list_id) {
    // Broadcast list updates to users in that list's room
    io.to(`list_${data.list_id}`).emit(event, data);
    console.log(`   Broadcast to list room: list_${data.list_id}`);
  } else {
    // Otherwise broadcast to all
    io.emit(event, data);
  }
  
  res.json({ success: true });
});

import SpotifyMonitor from "./utils/spotifyMonitor.js";
import { saveChatMessage } from "./utils/laravel.js";
import cookie from "cookie";

io.on("connection", (socket) => {
  console.log("Client connected via Socket.IO:", socket.id);
  
  // Register user mapping
  socket.on("register_user", (userId) => {
    if (!userId) return;
    const uid = String(userId);
    if (!userSockets.has(uid)) {
      userSockets.set(uid, new Set());
    }
    userSockets.get(uid).add(socket.id);
    socket.userId = uid;
    console.log(`User ${uid} registered with socket ${socket.id}`);
    
    // Notify others that this user is online
    io.emit('user_status', { userId: uid, status: 'online' });
  });

  // Extract Spotify token from cookies
  const cookiesStr = socket.handshake.headers.cookie || "";
  const cookies = cookie.parse(cookiesStr);
  const spotifyToken = cookies.spotify_access_token;
  
  let monitor = null;
  
  if (spotifyToken) {
    monitor = new SpotifyMonitor(io, socket, spotifyToken);
    monitor.start(10000); // Poll every 10 secs
  }

  // --- Chat Logic ---
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room: ${roomId}`);
  });

  socket.on("send_msg", async (data) => {
    const { roomId, userId, content, type, gifUrl, itemId, itemType, itemTitle, itemImage, itemSubtitle } = data;
    
    // 1. Broadcast to the room
    socket.to(roomId).emit("new_msg", data);

    // 2. Persist to Laravel
    try {
      await saveChatMessage(roomId, {
        user_id: userId,
        content,
        type: type || 'text',
        gif_url: gifUrl,
        item_id: itemId,
        item_type: itemType,
        item_title: itemTitle,
        item_image: itemImage,
        item_subtitle: itemSubtitle
      });
    } catch (err) {
      console.error("Failed to persist message:", err.message);
    }
  });

  socket.on("typing", (data) => {
    // data: { roomId, userName, isTyping }
    socket.to(data.roomId).emit("typing_status", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    if (socket.userId && userSockets.has(socket.userId)) {
      userSockets.get(socket.userId).delete(socket.id);
      if (userSockets.get(socket.userId).size === 0) {
        const uid = socket.userId;
        userSockets.delete(uid);
        // Notify others that this user is offline
        io.emit('user_status', { userId: uid, status: 'offline' });
      }
    }
    if (monitor) monitor.stop();
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});


