class GameService {
	#maxGuess = 3;
	constructor({ roomId, initialGM }) {
		this.users = new Map([[initialGM.id, initialGM]]);
		this.gameMaster = initialGM;
		this.roomId = roomId;
		this.userGuesses = new Map();
		this.question = null;
	}

	addQuestion({ question, userId, duration = 60, callback }) {
		if (userId === undefined) {
			throw new GameError("Please provide a user");
		}
		if (this.question !== null) {
			throw new GameError("There is already an active question");
		}
		if (userId !== this.gameMaster.id) {
			throw new GameError("You are not the current Game master");
		}
		if (!(question instanceof Question)) {
			throw new GameError("Invalid question");
		}
		this.timerId = setTimeout(() => {
			this.question = null;

			callback();
		}, duration * 1000);
		this.question = question;
	}

	answerQuestion({ userId, answer }) {
		let previousUserGuesses = this.userGuesses.get(userId);
		const userStore = this.users.get(userId);
		if (previousUserGuesses >= this.#maxGuess) {
			throw new GameError("Maximum guesses reached!");
		}
		if (userId === this.gameMaster.id) {
			throw new GameError("You are the Game master!");
		}

		if (this.question === null) {
			throw new GameError("There is no active question");
		}

		if (previousUserGuesses === undefined) {
			userStore.questionsAttempted += 1;
			this.userGuesses.set(userId, 0);
			previousUserGuesses = 0;
		}

		if (this.question.isCorrectAnswer(answer)) {
			console.log("Correct!");
			clearTimeout(this.timerId);
			this.timerId = null;
			userStore.score += 10;
			userStore.questionsCorrect += 1;
			this.nextQuestion();
			return true;
		} else {
			previousUserGuesses = previousUserGuesses + 1;
			this.userGuesses.set(userId, previousUserGuesses);

			return false;
		}
	}

	nextQuestion = () => {
		this.userGuesses.clear();
		this.question = null;
		this.updateGameMaster();
	};

	addUser(user) {
		this.users.set(user.id, user);
	}

	updateUserName({ id, name }) {
		this.users.get(id).name = name;
	}

	userLeaveRoom({ id }) {
		this.users.get(id).status = USER_STATUS.left;
	}
	userDisconnected({ id }) {
		this.users.get(id).status = USER_STATUS.disconnected;
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

class GameError extends Error {
	constructor(message) {
		super(message);
	}
}

module.exports = {
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
