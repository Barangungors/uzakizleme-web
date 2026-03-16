const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Köprünün (Socket.io) kapılarını Vercel'e ve dünyaya açıyoruz
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});



io.on('connection', (socket) => {
  console.log('✨ Bir kullanıcı bağlandı:', socket.id);

  // Odaya katılma komutu
  socket.on('join_party', (data) => {
    socket.join(data.partyId);
    console.log(`👥 ${socket.id} şu odaya girdi: ${data.partyId}`);
  });

  // --- VİDEO DEĞİŞTİRME KOMUTU ---
  socket.on('change_video', (data) => {
    console.log(`🎥 Yeni video talebi: ${data.videoUrl}`);
    // Odadaki herkese (isteyen hariç) yeni linki gönder
    socket.to(data.partyId).emit('video_changed', data.videoUrl);
  });

  // VİDEO KONTROLLERİ (Oynat, Durdur, Sar)
  socket.on('host_action', (data) => {
    // Gelen komutu odadaki diğer herkese "Senkronizasyon Güncellemesi" olarak pasla
    socket.to(data.partyId).emit('sync_update', {
      action: data.action,
      videoTime: data.videoTime,
      isPlaying: data.action === 'PLAY',
      lastUpdateEpoch: Date.now()
    });
  });

  // MESAJLAŞMA (Chat)
  socket.on('send_message', (data) => {
    io.to(data.partyId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Bir kullanıcı ayrıldı.');
  });
});

// Sunucuyu ayağa kaldırıyoruz
server.listen(PORT, () => {
  console.log(`🚀 Köprü (Sunucu) şu portta hazır: ${PORT}`);
});
// server.js en alt kısmı
// server.js dosyasının en altı tam olarak böyle olsun:
const PORT = process.env.PORT || 3001;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Köprü hazır! Port: ${PORT}`);
});