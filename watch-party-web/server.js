// server.js - TAM HALİ (Multi-Room & Auto-Host)
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
    
    // Oda yoksa oluştur
    if (!rooms[partyId]) {
      rooms[partyId] = {
        videoUrl: "https://www.youtube.com/watch?v=DzMrabVqiJE",
        isPlaying: false,
        hostId: socket.id, // Odayı kuran ilk kişi başkandır
        users: []
      };
    }

    const room = rooms[partyId];
    room.users.push({ id: socket.id, name: username || "Misafir" });

    // Kullanıcıya odanın tüm bilgisini gönder
    io.to(partyId).emit('room_state', {
      videoUrl: room.videoUrl,
      isPlaying: room.isPlaying,
      hostId: room.hostId, // Kimin sahip olduğu bilgisini herkes bilsin
      users: room.users
    });
  });

  // VİDEO DEĞİŞTİRME (Herkes değiştirebilsin mi? Evet, butona basan yetkili olsun)
  socket.on('change_video', ({ partyId, videoUrl }) => {
    if (rooms[partyId]) {
      rooms[partyId].videoUrl = videoUrl;
      rooms[partyId].hostId = socket.id; // Videoyu değiştiren kişi yeni BAŞKAN olur! (Senin sorunun çözümü)
      io.to(partyId).emit('video_changed', { videoUrl, hostId: socket.id });
    }
  });

  socket.on('play', ({ partyId, currentTime }) => {
    if (rooms[partyId] && rooms[partyId].hostId === socket.id) {
      socket.to(partyId).emit('play', currentTime);
    }
  });

  socket.on('pause', ({ partyId }) => {
    if (rooms[partyId] && rooms[partyId].hostId === socket.id) {
      socket.to(partyId).emit('pause');
    }
  });

  socket.on('disconnect', () => {
    for (const partyId in rooms) {
      rooms[partyId].users = rooms[partyId].users.filter(u => u.id !== socket.id);
      if (rooms[partyId].users.length === 0) {
        delete rooms[partyId];
      } else if (rooms[partyId].hostId === socket.id) {
        // Sahip çıkarsa sıradaki kişiyi başkan yap
        rooms[partyId].hostId = rooms[partyId].users[0].id;
        io.to(partyId).emit('room_state', rooms[partyId]);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server ${PORT} aktif!`));