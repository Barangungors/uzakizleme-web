// server.js - TAM SENKRONİZASYON
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};

io.on('connection', (socket) => {
  socket.on('join_party', ({ partyId, username }) => {
    socket.join(partyId);
    if (!rooms[partyId]) {
      rooms[partyId] = { videoUrl: "https://www.youtube.com/watch?v=DzMrabVqiJE", isPlaying: false, hostId: socket.id };
    }
    // Herkese güncel sahip ve video bilgisini gönder
    io.to(partyId).emit('room_state', { 
      videoUrl: rooms[partyId].videoUrl, 
      hostId: rooms[partyId].hostId 
    });
  });

  // BAŞKAN KOMUTLARI (Play/Pause/Seek)
  socket.on('media_command', ({ partyId, action, time }) => {
    if (rooms[partyId] && rooms[partyId].hostId === socket.id) {
      socket.to(partyId).emit('server_command', { action, time });
    }
  });

  socket.on('change_video', ({ partyId, videoUrl }) => {
    if (rooms[partyId] && rooms[partyId].hostId === socket.id) {
      rooms[partyId].videoUrl = videoUrl;
      io.to(partyId).emit('video_changed', videoUrl);
    }
  });

  socket.on('disconnect', () => { /* Çıkış işlemleri */ });
});

server.listen(process.env.PORT || 3001, "0.0.0.0", () => console.log("🚀 Server hazır!"));