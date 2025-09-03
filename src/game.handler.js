const { GameService, User, Question } = require("./game.service");
const EVENTS = require("./events");
const { Response } = require("./Response");
exports.gameHandler = (io, socket) => {
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

			updateScoreboard(roomId);
			updateActiveRooms();
		})
	);

	socket.on(
		EVENTS.user$join_room,
		errorWrapper(socket, ({ roomId, username }, ...args) => {
			const service = roomService.get(roomId);

			if (!service) {
				args[0](false);
				return;
			}
			socket.join(roomId);
			service.addUser(new User({ name: username, id: socket.id }));
			// acknowledge success
			args[0](true);
			updateScoreboard(roomId);
			updateActiveRooms();
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
			updateActiveRooms();
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
			roomService.get(roomId).addQuestion({
				question: questionModel,
				userId: socket.id,
				duration,
				callback,
			});

			updateActiveQuestion(roomId, questionModel);
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

	updateActiveQuestion = (roomId, questionModel) => {
		const payload = new Response("New Question Added", {
			data: {
				text: questionModel.text,
			},
		}).valueOf();
		io.in(roomId).emit(EVENTS.game$new_question, payload);
	};
	updateActiveRooms = () => {
		const activeRooms = Array.from(io.sockets.adapter.rooms.keys()).filter(
			(key) => typeof key === "string" && key.length === 4
		);
		const data = activeRooms.map((room) => {
			return { roomId: room };
		});
		io.emit(
			EVENTS.game$rooms,
			new Response("Active Rooms", { data: { rooms: data } }).valueOf()
		);
	};
	updateScoreboard = (roomId) => {
		const scoreboard = roomService.get(roomId)?.scoreboard();
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
			socket.emit(EVENTS.game$error, error);
		}
	};
};

roomCode = () => {
	return Math.floor(1000 + Math.random() * 9000).toString();
};

exports.sendUserActiveRooms = (io, socket) => {
	const activeRooms = Array.from(io.sockets.adapter.rooms.keys()).filter(
		(key) => typeof key === "string" && key.length === 4
	);
	const data = activeRooms.map((room) => {
		return { roomId: room };
	});
	socket.emit(
		EVENTS.game$rooms,
		new Response("Active Rooms", { data: { rooms: data } }).valueOf()
	);
};
