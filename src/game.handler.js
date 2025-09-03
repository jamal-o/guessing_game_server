const { GameService, User, Question } = require("./game.service");
const EVENTS = require("./events");
const { Response } = require("./Response");
module.exports = (io, socket) => {
	const roomService = new Map();
	socket.on(
		EVENTS.user$create_game,
		errorWrapper(socket, ({ username }, ...args) => {
			let roomId;

			do {
				roomId = roomCode();
			} while (socket.rooms.has(roomId));

			socket.join(roomId);
			const initialGM = new User({ name: username, id: socket.id });
			roomService.set(roomId, new GameService({ roomId, initialGM }));

			//acknoledgement sending back room id
			args[0](roomId);

			updateActiveRooms();
		})
	);

	socket.on(
		EVENTS.user$join_room,
		errorWrapper(socket, ({ roomId, userName }, ...args) => {
			socket.join(roomId);

			roomService
				.get(roomId)
				.addUser(new User({ name: userName, id: socket.id }));
			// acknowledge success
			args[0](true);
			updateScoreboard(roomId);
		})
	);

	socket.on(
		EVENTS.user$exit_room,
		errorWrapper(socket, ({ roomId }) => {
			socket.leave(roomId);
			roomService.get(roomId).userLeaveRoom(socket.id);

			if (socket.rooms.get(roomId).length == 0) {
				//TODO: end the game
				console.log("Close Room");
				return;
			}
			updateScoreboard(roomId);
		})
	);
	socket.on(
		EVENTS.user$add_question,
		errorWrapper(socket, ({ question, roomId, duration = 60 }) => {
			const questionModel = new Question({
				text: question["text"],
				answer: question["answer"],
			});
			const callback = () => {
				io.in(roomId).emit(EVENTS.game$question_timeout, {
					message: "Question timeout",
					question: questionModel,
				});
			};
			roomService
				.get(roomId)
				.addQuestion({ questionModel, userId: socket.id, duration, callback });
		})
	);

	socket.on(EVENTS.player$guess, ({ answer, roomId }, ...args) => {
		const ack = args[0];
		const isCorrect = roomService.get(roomId).answerQuestion({
			userId: socket.id,
			answer,
		});

		if (isCorrect) {
			const user = roomService.get(roomId).users.get(socket.id);
			ack(new Response("Correct Answer!"));
			socket
				.to(roomId)
				.emit(EVENTS.game$winner, new Response("Winner", { data: user }));
			updateScoreboard(roomId);
		} else {
			const userGuesses = roomService.get(roomId).userGuesses.get(socket.id);
			ack(new Response(`Incorrect Answer!: ${userGuesses} left`));
		}
	});

	updateActiveRooms = () => {
		const activeRooms = Array.from(io.sockets.adapter.rooms.keys()).filter(
			(key) => typeof key === "string" && key.length === 4
		);
		io.emit(
			EVENTS.game$rooms,
			new Response("Active Rooms", { data: activeRooms }).valueOf()
		);
	};
	updateScoreboard = (roomId) => {
		const scoreboard = roomService.get(roomId).scoreboard();
		io.in(roomId).emit(
			EVENTS.game$update_scoreboard,
			new Response("Updated scoreboard", { data: scoreboard })
		);
	};
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
	return Math.floor(1000 + Math.random() * 9000).toString();
};
