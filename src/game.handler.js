const {EVENTS} = require("./game.service");

module.exports = (io, socket) => {
	socket.on(EVENTS.user$create_game, createGame);

	socket.on(EVENTS.game$end_game, endGame);

	socket.on(EVENTS.game$question_timeout, (url, targets) => {});

	socket.on(EVENTS.game$update_scoreboard, (url, targets) => {});

	socket.on(EVENTS.game$winner, (url, targets) => {});

	socket.on(EVENTS.player$guess, (url, targets) => {});

	socket.on(EVENTS.user$add_question, (url, targets) => {});

	socket.on(EVENTS.user$exit_room, (url, targets) => {});
};

createGame = () => {
	try {
		console.log("createGame");
	} catch (error) {
		socket.emit(EVENTS.game$error, error.message);
	}
};

endGame = (url, targets) => {};
