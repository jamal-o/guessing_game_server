const { GameService, User, Question } = require("./game.service");
const EVENTS = require("./events");
const { Response } = require("./Response");
const roomService = new Map();
exports.gameHandler = (io, socket) => {
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
			socket.to(roomId).emit(
				EVENTS.user$chat,
				new Response("User Joined", {
					data: {
						text: `${username} has joined`,
						username: "bot",
						time: new Date(),
					},
				}).valueOf()
			);
			args[0](true);
			updateScoreboard(roomId);
			updateActiveRooms();
			const questionModel = service.question;
			updateActiveQuestion(roomId, questionModel);
		})
	);
	socket.on("disconnect", (reason) => {
		socket.rooms.forEach((roomId) => {
			roomService.get(roomId).userDisconnected({ id: socket.id });
			updateScoreboard(roomId);
			updateActiveRooms();

			// if (roomService.get(roomId).length == 0) {
			// 	//TODO: end the game
			// 	console.log("Close Room");
			// 	return;
			// }
		});
		console.log(`Socket ${socket.id} disconnected: ${reason}`);
	});
	socket.on(
		EVENTS.user$exit_room,
		errorWrapper(socket, ({ roomId }) => {
			const user = roomService.get(roomId).users.get(socket.id);
			socket.to(roomId).emit(
				EVENTS.user$chat,
				new Response("User left", {
					data: {
						text: `${user.name} has left`,
						username: "bot",
						time: new Date(),
					},
				}).valueOf()
			);
			socket.leave(roomId);
			// socket.removeAllListeners();
			roomService.get(roomId).userLeaveRoom({ id: socket.id });

			// if (socket.rooms.get(roomId).length == 0) {
			// 	//TODO: end the game
			// 	console.log("Close Room");
			// 	return;
			// }
			updateScoreboard(roomId);
			updateActiveRooms();
		})
	);
	socket.on(
		EVENTS.user$add_question,
		errorWrapper(socket, ({ question, roomId, duration = 60 }) => {
			if (roomService.get(roomId).users.size < 2) {
				throw new Error("Atleast 2 players required to start the game");
				return;
			}
			const questionModel = new Question({
				text: question["text"],
				answer: question["answer"],
			});
			const callback = () => {
				io.in(roomId).emit(EVENTS.game$question_timeout, {
					message: "Question timeout",
					question: questionModel,
				});

				updateActiveQuestion(roomId, null);
				updateScoreboard(roomId);
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

	socket.on(
		EVENTS.player$guess,
		errorWrapper(socket, ({ answer, roomId }, ...args) => {
			const isCorrect = roomService.get(roomId).answerQuestion({
				userId: socket.id,
				answer,
			});

			if (isCorrect) {
				const user = roomService.get(roomId).users.get(socket.id);
				// new Response("Correct Answer!");
				// console.log(JSON.stringify(user));
				socket.to(roomId).emit(
					EVENTS.game$winner,
					new Response("Winner", {
						data: { username: user.name, score: user.score },
					})
				);
				updateActiveQuestion(roomId, null);
				updateScoreboard(roomId);
			} else {
				const userGuesses = roomService.get(roomId).userGuesses.get(socket.id);
				socket.emit(
					EVENTS.game$alert,
					new Response(`Incorrect Answer!: ${userGuesses - 3} left`, {
						data: {
							text: `Incorrect Answer!: ${userGuesses - 3} left`,
						},
					})
				);
			}
		})
	);

	updateActiveQuestion = (roomId, questionModel) => {
		const payload =
			questionModel === null
				? new Response("No active question", { data: { text: null } }).valueOf()
				: new Response("New Question Added", {
						data: {
							text: questionModel?.text,
						},
				  }).valueOf();
		io.in(roomId).emit(EVENTS.game$new_question, payload);
	};
	updateActiveRooms = () => {
		const rooms = io.sockets.adapter.rooms;
		const activeRooms = Array.from(rooms.keys()).filter(
			(key) => typeof key === "string" && key.length === 4
		);
		const data = activeRooms.map((room) => {
			return { roomId: room , players: rooms.get(room).size };
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
			new Response("Updated scoreboard", { data: scoreboard }).valueOf()
		);
	};
};

errorWrapper = (socket, fn) => {
	return (...args) => {
		try {
			fn(...args);
		} catch (error) {
			socket.emit(
				EVENTS.game$alert,
				new Response(`${error.toString()} `, {
					success: false,
					data: {
						text: `${error.toString()} `,
					},
				}).valueOf()
			);
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
