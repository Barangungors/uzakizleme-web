const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// 🛠 CORS AYARI: Vercel üzerindeki frontend sitenin buraya bağlanabilmesi için şart.
const io = new Server(server, {
  cors: {
    origin: "*", // Geliştirme aşamasında her yerden bağlantıya izin veriyoruz.
    methods: ["GET", "POST"]
  }
});

// 🧠 ODA BELLEĞİ (Rooms): Sunucu açık olduğu sürece odaların bilgisini burada tutarız.
// Gerçek bir uygulamada bunlar veritabanında tutulur ama şu an en hızlı çözüm bu.
const rooms = {};

io.on('connection', (socket) => {
  console.log('✨ Yeni bir kullanıcı bağlandı. Kullanıcı ID:', socket.id);

  // 1️⃣ ODAYA GİRİŞ VE SENKRONİZASYON (Madde 6)
  socket.on('join_party', ({ partyId }) => {
    socket.join(partyId);
    console.log(`👤 Kullanıcı ${socket.id}, şu odaya katıldı: ${partyId}`);

    // Oda ilk kez oluşturuluyorsa varsayılan ayarları yükle
    if (!rooms[partyId]) {
      rooms[partyId] = {
        // 🚀 İSTEDİĞİN VARSAYILAN VİDEO LİNKİ
        videoUrl: "https://www.youtube.com/watch?v=DzMrabVqiJE",
        isPlaying: false,
        currentTime: 0,
        lastUpdatedAt: Date.now()
      };
    }

    const room = rooms[partyId];
    let syncTime = room.currentTime;

    // Eğer oda şu an oynatılıyorsa, aradan geçen süreyi hesaplayıp yeni gelene veriyoruz (Drift engelleme)
    if (room.isPlaying) {
      const elapsed = (Date.now() - room.lastUpdatedAt) / 1000;
      syncTime += elapsed;
    }

    // Odaya yeni giren kişiye odanın "canlı" durumunu gönder
    socket.emit('room_state', {
      videoUrl: room.videoUrl,
      isPlaying: room.isPlaying,
      currentTime: syncTime
    });
  });

  // 2️⃣ VİDEO DEĞİŞTİRME (ID TABANLI SİSTEM - Madde 1-4)
  socket.on('change_video', ({ partyId, videoUrl }) => {
    if (rooms[partyId]) {
      rooms[partyId].videoUrl = videoUrl;
      rooms[partyId].currentTime = 0;
      rooms[partyId].isPlaying = false;
      rooms[partyId].lastUpdatedAt = Date.now();
    }
    // Odadaki herkese (bize dahil) yeni videoyu yayınla
    io.to(partyId).emit('video_changed', videoUrl);
  });

  // 3️⃣ OYNAT (PLAY) KOMUTU (Madde 2)
  socket.on('play', ({ partyId, currentTime }) => {
    if (rooms[partyId]) {
      rooms[partyId].isPlaying = true;
      rooms[partyId].currentTime = currentTime;
      rooms[partyId].lastUpdatedAt = Date.now();
    }
    // Komutu gönderen hariç odadaki diğer herkese "başlat" mesajı at
    socket.to(partyId).emit('play', currentTime);
  });

  // 4️⃣ DURDUR (PAUSE) KOMUTU
  socket.on('pause', ({ partyId, currentTime }) => {
    if (rooms[partyId]) {
      rooms[partyId].isPlaying = false;
      rooms[partyId].currentTime = currentTime;
      rooms[partyId].lastUpdatedAt = Date.now();
    }
    socket.to(partyId).emit('pause', currentTime);
  });

  // 5️⃣ VİDEOYU SARMA (SEEK) KOMUTU (Madde 5)
  socket.on('seek', ({ partyId, currentTime }) => {
    if (rooms[partyId]) {
      rooms[partyId].currentTime = currentTime;
      rooms[partyId].lastUpdatedAt = Date.now();
    }
    socket.to(partyId).emit('seek', currentTime);
  });

  // 💬 SOHBET MESAJLARI
  socket.on('send_message', (data) => {
    io.to(data.partyId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Bir kullanıcı ayrıldı.');
  });
});

// Port Ayarı (Render gibi platformlar PORT'u kendisi atar)
const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Watch Party Sunucusu ${PORT} portunda aslanlar gibi çalışıyor!`);
});