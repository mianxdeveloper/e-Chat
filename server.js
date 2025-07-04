const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static('public'));

let users = {}; // userId: socketId

io.on('connection', socket => {
  socket.on('register', userId => {
    users[userId] = socket.id;
    socket.userId = userId;
    io.emit('online users', Object.keys(users));
  });

  socket.on('private message', ({ to, from, message }) => {
    const timestamp = new Date().toISOString(); // always send timestamp
    const payload = { from, message, timestamp };

    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit('private message', payload);
    }

    // ❌ No echo back to sender — sender already renders their message
  });

  socket.on('disconnect', () => {
    delete users[socket.userId];
    io.emit('online users', Object.keys(users));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Chat server running on port ${PORT}`));
