const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

io.on('connection', (socket) => {
  console.log('✨ Bir kullanıcı bağlandı:', socket.id);

  socket.on('join_party', (data) => {
    socket.join(data.partyId);
    console.log(`👥 ${socket.id} şu odaya girdi: ${data.partyId}`);
  });

  socket.on('change_video', (data) => {
    console.log(`🎥 Yeni video talebi: ${data.videoUrl}`);
    socket.to(data.partyId).emit('video_changed', data.videoUrl);
  });

  socket.on('host_action', (data) => {
    socket.to(data.partyId).emit('sync_update', {
      action: data.action,
      videoTime: data.videoTime,
      isPlaying: data.action === 'PLAY',
      lastUpdateEpoch: Date.now()
    });
  });

  socket.on('send_message', (data) => {
    io.to(data.partyId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Bir kullanıcı ayrıldı.');
  });
});

// Dikkat: Burada sadece TEK BİR TANE server.listen var!
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Köprü (Sunucu) şu portta hazır: ${PORT}`);
});