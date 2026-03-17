const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS Ayarları: Vercel sitemizin sunucuya bağlanmasına izin veriyoruz
const io = new Server(server, {
  cors: {
    origin: "*", // Güvenlik için ileride buraya sadece vercel linkini yazabilirsin
    methods: ["GET", "POST"]
  }
});

// 🧠 ODA HAFIZASI: Sunucu açık kaldığı sürece odaların durumunu burada tutar
const rooms = {};

io.on('connection', (socket) => {
  console.log('✨ Bir kullanıcı bağlandı. ID:', socket.id);

  // 1️⃣ ODAYA KATILMA (Room Logic)
  socket.on('join_party', ({ partyId }) => {
    socket.join(partyId);
    console.log(`👤 ${socket.id} şu odaya girdi: ${partyId}`);

    // Oda hafızada yoksa oluştur (Varsayılan video ile başlat)
    if (!rooms[partyId]) {
      rooms[partyId] = {
        videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        isPlaying: false,
        currentTime: 0,
        lastUpdatedAt: Date.now()
      };
    }

    // 🔄 YENİ GELENİ SENKRONİZE ET (Madde 6)
    const room = rooms[partyId];
    let syncTime = room.currentTime;

    // Eğer video şu an oynuyorsa, geçen süreyi hesapla (Zaman kaymasını engelle)
    if (room.isPlaying) {
      const elapsed = (Date.now() - room.lastUpdatedAt) / 1000;
      syncTime += elapsed;
    }

    socket.emit('room_state', {
      videoUrl: room.videoUrl,
      isPlaying: room.isPlaying,
      currentTime: syncTime
    });
  });

  // 2️⃣ VİDEO DEĞİŞTİRME (Madde 1, 3, 4)
  socket.on('change_video', ({ partyId, videoUrl }) => {
    if (rooms[partyId]) {
      rooms[partyId].videoUrl = videoUrl;
      rooms[partyId].currentTime = 0;
      rooms[partyId].isPlaying = false;
      rooms[partyId].lastUpdatedAt = Date.now();
    }
    // Odadaki herkese yeni videoyu bildir
    io.to(partyId).emit('video_changed', videoUrl);
  });

  // 3️⃣ PLAY (Oynat) KOMUTU
  socket.on('play', ({ partyId, currentTime }) => {
    if (rooms[partyId]) {
      rooms[partyId].isPlaying = true;
      rooms[partyId].currentTime = currentTime;
      rooms[partyId].lastUpdatedAt = Date.now();
    }
    // Gönderen kişi hariç odadaki herkese "oynat" de
    socket.to(partyId).emit('play', currentTime);
  });

  // 4️⃣ PAUSE (Durdur) KOMUTU
  socket.on('pause', ({ partyId, currentTime }) => {
    if (rooms[partyId]) {
      rooms[partyId].isPlaying = false;
      rooms[partyId].currentTime = currentTime;
      rooms[partyId].lastUpdatedAt = Date.now();
    }
    socket.to(partyId).emit('pause', currentTime);
  });

  // 5️⃣ SEEK (Sarma) KOMUTU (Madde 5)
  socket.on('seek', ({ partyId, currentTime }) => {
    if (rooms[partyId]) {
      rooms[partyId].currentTime = currentTime;
      rooms[partyId].lastUpdatedAt = Date.now();
    }
    socket.to(partyId).emit('seek', currentTime);
  });

  // 💬 SOHBET SİSTEMİ
  socket.on('send_message', (data) => {
    io.to(data.partyId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Bir kullanıcı ayrıldı.');
  });
});

// Render veya Heroku gibi servisler için PORT ayarı
const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Watch Party Sunucusu ${PORT} portunda hazır!`);
});