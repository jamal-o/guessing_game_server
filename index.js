const app = require("./src/app");
const { createServer } = require("http");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);

const io = new Server(httpServer, {
	cors: { origin: [process.env.CLIENT_URL] },
});

const gameHandler = require("./src/game.handler");
const chatHandler = require("./src/chat.handler");
io.use((socket, next) => {
	console.log("event registered " + socket.eventNames());
	
	next();
});

io.on("connection", (socket) => {
	gameHandler(io, socket);

	chatHandler(io, socket);

	// socket.onAny((event, ...args) => {
	// 	console.log(`Event: ${event}; args: ${args}`);
	// });

	console.log("Connection established to socket: " + socket.id);
});

io.on("disconnect", (reason) => {
	console.log(`Disconnected: ${reason}`);
});

httpServer.listen(PORT, () => {
	console.log(`Server running on ${PORT}...`);
});
