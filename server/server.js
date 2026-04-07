import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://127.0.0.1:5171", "http://localhost:5171"],
    credentials: true,
  }
});

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://127.0.0.1:5171", "http://localhost:5171"],
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
  res.json({ status: "ok", service: "Scenes & Beats API" });
});

import SpotifyMonitor from "./utils/spotifyMonitor.js";
import cookie from "cookie"; // You might need to install this if missing

io.on("connection", (socket) => {
  console.log("Client connected via Socket.IO:", socket.id);
  
  // Extract Spotify token from cookies
  const cookiesStr = socket.handshake.headers.cookie || "";
  const cookies = cookie.parse(cookiesStr);
  const spotifyToken = cookies.spotify_access_token;
  
  let monitor = null;
  
  if (spotifyToken) {
    monitor = new SpotifyMonitor(io, socket, spotifyToken);
    monitor.start(10000); // Poll every 10 secs
  }

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    if (monitor) monitor.stop();
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
