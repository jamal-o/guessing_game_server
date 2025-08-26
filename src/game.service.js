class GameService {
	#maxGuess = 3;
	constructor({ roomId, initialGM }) {
		this.users = new Map([[initialGM.id, initialGM]]);
		this.gameMaster = initialGM;
		this.roomId = roomId;
		this.userGuesses = new Map();
		this.question = null;
	}

	addQuestion({ question, user }) {
		if (user === undefined) {
			throw new GameError("Please provide a user");
		}
		if (user.id !== this.gameMaster.id) {
			throw new GameError("You are not the Game master");
		}
		if (!question instanceof Question) {
			throw new GameError("Invalid question");
		}
		this.question = question;
	}

	answerQuestion({ user, answer }) {
		let previousUserGuesses = this.userGuesses.get(user.id);
		const userStore = this.users.get(user.id);
		if (previousUserGuesses >= this.#maxGuess) {
			throw GameError("Maximum guesses reached!");
		}
		if (user.id === this.gameMaster.id) {
			throw GameError("You are the Game master!");
		}

		if (previousUserGuesses === undefined) {
			userStore.questionsAttempted += 1;
			this.userGuesses.set(user.id, 0);
			previousUserGuesses = 0;
		}

		if (this.question.isCorrectAnswer(answer)) {
			console.log("Correct!");
			userStore.score += 10;
			userStore.questionsCorrect += 1;
			this.userGuesses.clear();
			this.updateGameMaster();
			return true;
		} else {
			previousUserGuesses = previousUserGuesses + 1;
			return false;
		}
	}

	addUser(user) {
		this.users.set(user.id, user);
	}

	updateUser({ id, user }) {
		//refactor to allow only changing name
		this.users[id] = user;
	}

	updateGameMaster() {
		const keysArray = Array.from(this.users.keys());

		const currentIndex = keysArray.indexOf(this.gameMaster.id);
		const nextIndex = (currentIndex + 1) % keysArray.length;
		this.gameMaster = this.users.get(keysArray[nextIndex]);
	}

	scoreboard() {
		return {
			gameMaster: this.gameMaster,
			players: [...this.users.values()],
		};
	}
}

class Question {
	constructor({ text, answer }) {
		if (typeof text !== "string" || typeof answer !== "string") {
			throw new GameError("Invalid Question");
		}
		this.text = text;
		this.correctAnswer = answer;
	}

	isCorrectAnswer(answer) {
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

	toString() {
		return {
			name: this.name,
			status: this.status,
			score: this.score,
			questionsAttempted: this.questionsAttempted,
			questionsCorrect: this.questionsCorrect,
		};
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
	user$skip_turn: "user$skip_turn",

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
		super(message);
	}
}

module.exports = {
	EVENTS,
	GameError,
	User,
	USER_STATUS,
	Question,
	GameService,
};

// let initialGM = new User({ name: "joe", id: "1bc-123" });
// let gameService = new GameService({ roomId: 1004, initialGM });

// let player1 = new User({ name: "james", id: "1xy-143" });
// let player2 = new User({ name: "john", id: "1cd-143" });
// gameService.addUser(player1);
// gameService.addUser(player2);
// console.log(gameService.scoreboard());

// let question = new Question({
// 	text: "What is the capital of Nigeria",
// 	answer: "Abuja",
// });
// gameService.addQuestion({ question, user: player1 });
// console.log(gameService.question);

// gameService.answerQuestion({ user: player1, answer: "Kaduna" });
// gameService.answerQuestion({ user: player2, answer: "Abujas" });
// gameService.answerQuestion({ user: player1, answer: "Abuja" });
// console.log(JSON.stringify(gameService.scoreboard()));

// gameService.addQuestion({ question, user: player2 });
// gameService.answerQuestion({ user: player1, answer: "Kaduna" });
// gameService.answerQuestion({ user: player2, answer: "Abujas" });
// gameService.answerQuestion({ user: player1, answer: "Abuja" });
