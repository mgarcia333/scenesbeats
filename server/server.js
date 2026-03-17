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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Scenes & Beats API" });
});

io.on("connection", (socket) => {
  console.log("Client connected via Socket.IO:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
