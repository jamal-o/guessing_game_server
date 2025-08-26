const { EVENTS, GameService, User } = require("./game.service");

module.exports = (io, socket) => {
	const roomService = new Map();
	socket.on(
		EVENTS.user$create_game,
		errorWrapper(socket, ({ username, ack, } ,...args ) => {
			let roomId;
			do {
				roomId = roomCode();
			} while (socket.rooms.has(roomId));

			socket.join(roomId);
			const initialGM = new User({ name: username, id: socket.id });
			roomService.set(roomId, new GameService({ roomId, initialGM }));
			console.log(...args);
			args[0](roomId);
		})
	);
	// create-room (argument: room)
	// delete-room (argument: room)
	// join-room (argument: room, id)
	// leave-room (argument: room, id)
	// socket.on(
	// 	EVENTS.game$end_game,
	// 	errorWrapper(({ roomId, user }) => {
	// 		socket.delete
	// 	})
	// );

	socket.on(EVENTS.game$question_timeout, () => {});

	socket.on(EVENTS.game$update_scoreboard, () => {});

	socket.on(EVENTS.game$winner, () => {});

	socket.on(EVENTS.player$guess, () => {});

	socket.on(EVENTS.user$add_question, () => {});

	socket.on(EVENTS.user$exit_room, () => {});
};

errorWrapper = (socket, fn) => {
	return (...args) => {
		try {
			fn(...args);
		} catch (error) {
			socket.emit(EVENTS.game$error, error.message);
		}
	};
};

roomCode = () => {
	return Math.floor(1000 + Math.random() * 9000);
};
