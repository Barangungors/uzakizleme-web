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
      rooms[partyId] = {
        videoUrl: "https://www.youtube.com/watch?v=DzMrabVqiJE",
        isPlaying: false,
        hostId: socket.id, // İlk giren Başkan (Host)
        users: []
      };
    }

    const room = rooms[partyId];
    room.users.push({ id: socket.id, name: username || `Kullanıcı_${socket.id.slice(0,4)}` });

    // Odaya giren herkese güncel listeyi ve durumu yolla
    io.to(partyId).emit('room_state', {
      videoUrl: room.videoUrl,
      isPlaying: room.isPlaying,
      isHost: room.hostId === socket.id,
      users: room.users
    });
  });

  socket.on('play', ({ partyId, currentTime }) => {
    if (rooms[partyId]?.hostId === socket.id) {
      socket.to(partyId).emit('play', currentTime);
    }
  });

  socket.on('pause', ({ partyId }) => {
    if (rooms[partyId]?.hostId === socket.id) {
      socket.to(partyId).emit('pause');
    }
  });

  socket.on('disconnect', () => {
    // Odalardan kullanıcıyı temizle
    for (const partyId in rooms) {
      rooms[partyId].users = rooms[partyId].users.filter(u => u.id !== socket.id);
      if (rooms[partyId].users.length === 0) {
        delete rooms[partyId];
      } else if (rooms[partyId].hostId === socket.id) {
        // Sahip çıktıysa sıradaki kişiyi başkan yap
        rooms[partyId].hostId = rooms[partyId].users[0].id;
        io.to(partyId).emit('new_host', rooms[partyId].hostId);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server ${PORT} aktif!`));