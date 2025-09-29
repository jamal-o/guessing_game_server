const app = require("./src/app");
const { createServer } = require("http");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;
const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    data: 'Hello World!',
  }));
});;

const path = require("path");
const fs = require("fs");

const NODE_ENV = process.env.NODE_ENV || "development";
const envFilePath = path.resolve(__dirname, `.env.${NODE_ENV}`);
if (fs.existsSync(envFilePath)) {
	require("dotenv").config({ path: envFilePath });
	console.log(`Loaded env: ${envFilePath}`);
} else {
	require("dotenv").config();
	console.log("Loaded default .env");
}

const io = new Server(httpServer, {
	cors: { origin: [process.env.CLIENT_URL] },
});

const { gameHandler } = require("./src/game.handler");

const sendUserActiveRooms = require("./src/game.handler").sendUserActiveRooms;
const chatHandler = require("./src/chat.handler");
io.use((socket, next) => {
	console.log("event registered " + socket.eventNames());

	next();
});

io.on("connection", (socket) => {
	gameHandler(io, socket);

	chatHandler(io, socket);

	sendUserActiveRooms(io, socket);

	socket.onAny((event, ...args) => {
		console.log(`Event: ${event}; args: ${JSON.stringify(args)}`);
	});

	console.log("Connection established to socket: " + socket.id);
});

io.on("disconnect", (reason) => {
	console.log(`Disconnected: ${reason}`);
});

httpServer.listen(PORT, () => {
	console.log(`Server running on Port: ${PORT}...`);
});
