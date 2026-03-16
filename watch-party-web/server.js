const { Server } = require("socket.io");

// Bulut sunucusu kendi portunu (PORT) verir, vermezse 3001 kullanırız
const PORT = process.env.PORT || 3002;

const io = new Server(PORT, {
  cors: { origin: "*" } 
});

io.on("connection", (socket) => {
  console.log("Yeni kullanıcı: ", socket.id);

  socket.on("join_party", ({ partyId }) => {
    socket.join(partyId);
  });

  socket.on("host_action", (data) => {
    socket.to(data.partyId).emit("sync_update", {
      isPlaying: data.action === 'PLAY',
      videoTime: data.videoTime,
      lastUpdateEpoch: Date.now()
    });
  });
  // --- YENİ EKLENEN KISIM: Video Değiştirme ---
  socket.on("change_video", (data) => {
    console.log(`🎥 Yeni video açıldı: ${data.videoUrl}`);
    // Odadaki herkese (kendisi hariç) yeni linki gönder
    socket.to(data.partyId).emit("video_changed", data.videoUrl);
  });
  // --------------------------------------------

  socket.on("send_message", (data) => {
    console.log("📥 Mesaj:", data.message.text);
    io.to(data.partyId).emit("receive_message", data.message);
  });
});

console.log(`🚀 Sunucu ${PORT} portunda çalışıyor...`);