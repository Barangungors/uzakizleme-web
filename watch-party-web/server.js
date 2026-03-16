const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// ODA HAFIZASI (Hangi odada hangi video, kaçıncı saniyede çalıyor)
const rooms = {};

io.on('connection', (socket) => {
  console.log('✨ Yeni bağlantı:', socket.id);

  // 1. ODAYA KATILMA VE YENİ GELENE SENKRONİZASYON (Madde 6)
  socket.on('join_party', ({ partyId }) => {
    socket.join(partyId);
    
    // Oda ilk kez açılıyorsa varsayılan değerleri oluştur
    if (!rooms[partyId]) {
      rooms[partyId] = {
        videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        isPlaying: false,
        currentTime: 0,
        lastUpdatedAt: Date.now()
      };
    }

    const room = rooms[partyId];
    
    // Eğer video şu an oynuyorsa, geçen süreyi hesaplayıp yeni gelene tam saniyeyi ver (Drift engelleme)
    let calculatedTime = room.currentTime;
    if (room.isPlaying) {
      calculatedTime += (Date.now() - room.lastUpdatedAt) / 1000;
    }

    // Yeni gelen kişiye odanın şu anki durumunu gönder
    socket.emit('room_state', {
      videoUrl: room.videoUrl,
      isPlaying: room.isPlaying,
      currentTime: calculatedTime
    });
  });

  // 2. VİDEO DEĞİŞTİRME (Madde 1)
  socket.on('change_video', ({ partyId, videoUrl }) => {
    if (rooms[partyId]) {
      rooms[partyId].videoUrl = videoUrl;
      rooms[partyId].currentTime = 0;
      rooms[partyId].isPlaying = false;
    }
    io.to(partyId).emit('video_changed', videoUrl);
  });

  // 3. PLAY, PAUSE VE SEEK (Sarma) İŞLEMLERİ (Madde 2 ve 5)
  socket.on('play', ({ partyId, currentTime }) => {
    if (rooms[partyId]) {
      rooms[partyId].isPlaying = true;
      rooms[partyId].currentTime = currentTime;
      rooms[partyId].lastUpdatedAt = Date.now();
    }
    socket.to(partyId).emit('play', currentTime);
  });

  socket.on('pause', ({ partyId, currentTime }) => {
    if (rooms[partyId]) {
      rooms[partyId].isPlaying = false;
      rooms[partyId].currentTime = currentTime;
      rooms[partyId].lastUpdatedAt = Date.now();
    }
    socket.to(partyId).emit('pause', currentTime);
  });

  socket.on('seek', ({ partyId, currentTime }) => {
    if (rooms[partyId]) {
      rooms[partyId].currentTime = currentTime;
      rooms[partyId].lastUpdatedAt = Date.now();
    }
    socket.to(partyId).emit('seek', currentTime);
  });

  // Sohbet sistemi
  socket.on('send_message', (data) => {
    io.to(data.partyId).emit('receive_message', data);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Watch Party Sunucusu ${PORT} portunda hazır!`);
});