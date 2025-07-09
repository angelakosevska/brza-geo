// sockets/socketHandlers.js
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ A user connected:', socket.id);

    socket.on('joinRoom', ({ roomCode, username }) => {
      socket.join(roomCode);
      console.log(`${username} joined room ${roomCode}`);
      io.to(roomCode).emit('userJoined', { username });
    });

    socket.on('startGame', ({ roomCode, letter, round }) => {
      io.to(roomCode).emit('gameStarted', { letter, round });
    });

    socket.on('playerSubmitted', ({ roomCode, username }) => {
      io.to(roomCode).emit('playerSubmittedUpdate', { username });
    });

    socket.on('sendResults', ({ roomCode, results }) => {
      io.to(roomCode).emit('roundResults', results);
    });

    socket.on('leaveRoom', ({ roomCode, username }) => {
      socket.leave(roomCode);
      io.to(roomCode).emit('userLeft', { username });
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });
};
