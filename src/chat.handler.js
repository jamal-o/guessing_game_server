const EVENTS  = require("./events");
const { Response } = require("./Response");

module.exports = (io, socket) => {
	socket.on(EVENTS.user$chat, ({ message, roomId }) => {
		try {
			console.log("Received message:", message);
			// Broadcast the message to all connected clients
			io.to(roomId).emit(EVENTS.user$chat, new Response("message", {
				data: {
					text: message.text,
					time: message.time,
					username: message.username,
				}
			}));
		} catch (error) {
			socket.emit(EVENTS.game$error, new Response(error.message, {success:false, data: "Could not emit message"}).valueOf());
		}
	});
};
