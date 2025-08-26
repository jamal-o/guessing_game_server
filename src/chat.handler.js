const { EVENTS } = require("./game.service");

module.exports = (io, socket) => {
	socket.on(EVENTS.user$chat, ({ message, roomId }) => {
		try {
			console.log("Received message:", message);
			// Broadcast the message to all connected clients
			socket.to(roomId).emit(EVENTS.user$chat, message);
		} catch (error) {
			socket.emit(EVENTS.game$error, error.message);
		}
	});
};
