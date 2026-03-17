// server.js tam hali - "Oda Sahibi" Mantığıyla
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};

io.on('connection', (socket) => {
  socket.on('join_party', ({ partyId }) => {
    socket.join(partyId);

    if (!rooms[partyId]) {
      rooms[partyId] = {
        videoUrl: "https://www.youtube.com/watch?v=DzMrabVqiJE",
        isPlaying: false,
        currentTime: 0,
        hostId: socket.id, // 🚀 Odaya ilk giren kişi HOST (Sahip) olur
        lastUpdatedAt: Date.now()
      };
    }

    const room = rooms[partyId];
    
    // Kullanıcıya hem oda durumunu hem de "Sen sahibi misin?" bilgisini yolla
    socket.emit('room_state', {
      videoUrl: room.videoUrl,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      isHost: room.hostId === socket.id // Sahip kontrolü
    });
  });

  // Sadece HOST'tan gelen komutları dağıt (Güvenlik)
  socket.on('play', ({ partyId, currentTime }) => {
    if (rooms[partyId] && rooms[partyId].hostId === socket.id) {
      rooms[partyId].isPlaying = true;
      rooms[partyId].currentTime = currentTime;
      socket.to(partyId).emit('play', currentTime);
    }
  });

  socket.on('pause', ({ partyId }) => {
    if (rooms[partyId] && rooms[partyId].hostId === socket.id) {
      rooms[partyId].isPlaying = false;
      socket.to(partyId).emit('pause');
    }
  });

  socket.on('change_video', ({ partyId, videoUrl }) => {
    if (rooms[partyId] && rooms[partyId].hostId === socket.id) {
      rooms[partyId].videoUrl = videoUrl;
      io.to(partyId).emit('video_changed', videoUrl);
    }
  });

  socket.on('disconnect', () => {
    // Sahip çıkarsa odayı temizle veya başkasına devret (şimdilik basit tutuyoruz)
    console.log("Kullanıcı ayrıldı");
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Sunucu ${PORT} aktif!`));