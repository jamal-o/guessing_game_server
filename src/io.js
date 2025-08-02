const { Server } = require("socket.io");


const io = new Server(httpServer, { /* options */ });

io.on("connection", (socket) => {
  // ...
});