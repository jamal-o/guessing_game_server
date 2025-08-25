class GameService {
	constructor({ roomId, initialGM }) {
		this.users = {};
		this.gameMaster = initialGM;
		this.roomId = roomId;
		this.userGuesses = {};
		this.question = null;
	}

	addQuestion(question) {
		this.question = question;
	}

	answerQuestion({ user, answer }) {
		const previousUserGuesses = this.userGuesses[user.id] ?? 0;
		const maxGuess = 3;
		if (previousUserGuesses >= maxGuess) {
			throw GameError("Maximum guesses reached");
		}
		if (user.id === this.gameMaster.id) {
			throw GameError("You are the Game master");
		}
		if (this.question.correctAnswer(answer)) {
			this.userGuesses = {};
			this.updateGameMaster();
			return true;
		} else {
			this.userGuesses[user.id] = previousUserGuesses + 1;
			return false;
		}
	}

	addUser(user) {
		this.users[user.id] = user;
	}

	updateUser({ id, user }) {
		this.users[id] = user;
	}

	updateGameMaster() {
		const currentIndex = users.indexOf(this.gameMaster.id);
		const nextIndex = (currentIndex + 1) % this.users.length;
		this.gameMaster = userIds[nextIndex];
	}
}

class Question {
	constructor({ text, correctAnswer }) {
		this.text = text;
		this.correctAnswer = correctAnswer;
	}

	correctAnswer(answer) {
		return this.correctAnswer === answer;
	}
}

class User {
	constructor({ name, id }) {
		this.name = name;
		this.id = id;
		this.status = USER_STATUS.online;
		this.score = 0;
		this.questionsAttempted = 0;
		this.questionsCorrect = 0;
	}
}

const USER_STATUS = {
	online: "online",
	disconnected: "disconnected",
	left: "left",
};

const EVENTS = {
	//player
	player$guess: "player$guess,",

	//game_master
	user$create_game: "user$create_game",
	user$add_question: "user$add_question",

	//user
	user$chat: "user$chat",
	user$exit_room: "user$exit_room",
	user$join_room: "user$join_room",

	//game
	game$update_scoreboard: "game$update_scoreboard",
	game$question_timeout: "game$question_timeout",
	game$winner: "game$winner",
	game$end_game: "game$end_game",
	game$error: "game$error",
};

class GameError extends Error {
	constructor(message) {
		this.message = message;
	}
}

module.exports = {
	EVENTS,
	GameError,
	USER_STATUS,
	Question,
	GameService,
};
