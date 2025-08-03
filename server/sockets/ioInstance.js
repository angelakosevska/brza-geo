// ioInstance.js
let io = null;

module.exports = {
  initSocket: (server) => {
    io = require("socket.io")(server, {
      cors: { origin: "*" }
    });
    return io;
  },
  getIO: () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
  }
};
