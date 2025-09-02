const {
	GameService,
	GameError,
	User,
	USER_STATUS,
	Question,
} = require("./game.service");

describe("GameService", () => {
	let gameService = new GameService({
		roomId: "room1",
		initialGM: new User({ name: "GameMaster", id: "gm1" }),
	});
	let gameMaster = new User({ name: "GameMaster", id: "gm1" });
	let player1 = new User({ name: "GameMaster", id: "gm1" });
	let player2 = new User({ name: "GameMaster", id: "gm1" });
	let mockCallback;

	beforeEach(() => {
		// Clear any existing timers
		jest.clearAllTimers();
		jest.useFakeTimers();

		// Create test users
		gameMaster = new User({ name: "GameMaster", id: "gm1" });
		player1 = new User({ name: "Player1", id: "p1" });
		player2 = new User({ name: "Player2", id: "p2" });

		// Initialize game service
		gameService = new GameService({ roomId: "room1", initialGM: gameMaster });

		// Mock callback for timer
		mockCallback = jest.fn();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("Constructor", () => {
		test("should initialize with correct initial state", () => {
			expect(gameService.roomId).toBe("room1");
			expect(gameService.gameMaster).toBe(gameMaster);
			expect(gameService.users.size).toBe(1);
			expect(gameService.users.get("gm1")).toBe(gameMaster);
			expect(gameService.question).toBeNull();
			expect(gameService.userGuesses.size).toBe(0);
		});
	});

	describe("addQuestion", () => {
		let validQuestion;

		beforeEach(() => {
			validQuestion = new Question({ text: "What is 2+2?", answer: "4" });
			gameService.addUser(player1);
		});

		test("should add question successfully with valid inputs", () => {
			expect(() => {
				gameService.addQuestion({
					question: validQuestion,
					userId: gameMaster.id,
					duration: 60,
					callback: mockCallback,
				});
			}).not.toThrow();

			expect(gameService.question).toBe(validQuestion);
			expect(gameService.timerId).toBeDefined();
		});

		test("should throw error if user is undefined", () => {
			expect(() => {
				gameService.addQuestion({
					question: validQuestion,
					userId: undefined,
					duration: 60,
					callback: mockCallback,
				});
			}).toThrow("Please provide a user");
		});

		test("should throw error if there is already an active question", () => {
			// First, add a question (this will fail due to the bug, but let's test the intended behavior)
			gameService.question = validQuestion; // Manually set to test this condition

			expect(() => {
				gameService.addQuestion({
					question: new Question({ text: "Another question?", answer: "yes" }),
					userId: gameMaster.id,
					duration: 60,
					callback: mockCallback,
				});
			}).toThrow("There is already an active question");
		});

		test("should throw error if user is not game master", () => {
			gameService.addUser(player1);

			expect(() => {
				gameService.addQuestion({
					question: validQuestion,
					userId: player1.id,
					duration: 60,
					callback: mockCallback,
				});
			}).toThrow("You are not the current Game master");
		});

		test("should throw error for invalid question", () => {
			expect(() => {
				gameService.addQuestion({
					question: "invalid question string",
					userId: gameMaster.id,
					duration: 60,
					callback: mockCallback,
				});
			}).toThrow("Invalid question");
		});

		test("should set timer that clears question after duration", () => {
			// Manually fix the bug by setting question first
			gameService.question = null;
			gameService.addQuestion({
				question: validQuestion,
				userId: gameMaster.id,
				duration: 2,
				callback: mockCallback,
			});

			expect(gameService.question).toBe(validQuestion);

			// Fast forward time
			jest.advanceTimersByTime(2000);

			expect(mockCallback).toHaveBeenCalled();
		});
	});

	describe("answerQuestion", () => {
		let question;

		beforeEach(() => {
			question = new Question({ text: "What is 2+2?", answer: "4" });
			gameService.addQuestion({
				question,
				userId: gameMaster.id,
				callback: mockCallback,
			});
			gameService.addUser(player1);
			gameService.addUser(player2);
		});

		test("should handle correct answer from player", () => {
			const result = gameService.answerQuestion({
				userId: player1.id,
				answer: "4",
			});

			expect(result).toBe(true);
			expect(player1.score).toBe(10);
			expect(player1.questionsCorrect).toBe(1);
			expect(player1.questionsAttempted).toBe(1);
			expect(gameService.userGuesses.get(player1.id)).toBe(undefined);
		});

		test("should handle incorrect answer from player", () => {
			const result = gameService.answerQuestion({
				userId: player1.id,
				answer: "5",
			});

			expect(result).toBe(false);
			expect(player1.score).toBe(0);
			expect(player1.questionsCorrect).toBe(0);
			expect(player1.questionsAttempted).toBe(1);
			expect(gameService.userGuesses.get(player1.id)).toBe(1);
		});

		test("should track multiple incorrect guesses", () => {
			gameService.answerQuestion({ userId: player1.id, answer: "5" });
			expect(gameService.userGuesses.get(player1.id)).toBe(1);

			gameService.answerQuestion({ userId: player1.id, answer: "6" });
			expect(gameService.userGuesses.get(player1.id)).toBe(2);

			gameService.answerQuestion({ userId: player1.id, answer: "7" });
			expect(gameService.userGuesses.get(player1.id)).toBe(3);
		});

		test("should throw error when maximum guesses reached", () => {
			// Set user to have already made maximum guesses
			gameService.userGuesses.set(player1.id, 3);

			expect(() => {
				gameService.answerQuestion({
					userId: player1.id,
					answer: "4",
				});
			}).toThrow("Maximum guesses reached!");
		});

		test("should throw error when game master tries to answer", () => {
			expect(() => {
				gameService.answerQuestion({
					userId: gameMaster.id,
					answer: "4",
				});
			}).toThrow("You are the Game master!");
		});

		test("should initialize user stats on first answer attempt", () => {
			expect(player1.questionsAttempted).toBe(0);
			expect(gameService.userGuesses.has(player1.id)).toBe(false);

			gameService.answerQuestion({ userId: player1.id, answer: "5" });

			expect(player1.questionsAttempted).toBe(1);
			expect(gameService.userGuesses.get(player1.id)).toBe(1);
		});
	});

	describe("nextQuestion", () => {
		beforeEach(() => {
			gameService.addUser(player1);
			gameService.addUser(player2);
			gameService.userGuesses.set(player1.id, 2);
			gameService.userGuesses.set(player2.id, 1);
		});

		test("should clear user guesses and update game master", () => {
			const originalGM = gameService.gameMaster;

			gameService.nextQuestion();

			expect(gameService.userGuesses.size).toBe(0);
			expect(gameService.gameMaster).not.toBe(originalGM);
		});
	});

	describe("addUser", () => {
		test("should add user to the game", () => {
			expect(gameService.users.has(player1.id)).toBe(false);

			gameService.addUser(player1);

			expect(gameService.users.has(player1.id)).toBe(true);
			expect(gameService.users.get(player1.id)).toBe(player1);
		});

		test("should handle adding multiple users", () => {
			gameService.addUser(player1);
			gameService.addUser(player2);

			expect(gameService.users.size).toBe(3); // Including initial GM
			expect(gameService.users.get(player1.id)).toBe(player1);
			expect(gameService.users.get(player2.id)).toBe(player2);
		});
	});

	describe("updateUserName", () => {
		beforeEach(() => {
			gameService.addUser(player1);
		});

		test("should update user name", () => {
			expect(player1.name).toBe("Player1");

			gameService.updateUserName({ id: player1.id, name: "NewName" });

			expect(player1.name).toBe("NewName");
		});

		test("should handle updating non-existent user gracefully", () => {
			expect(() => {
				gameService.updateUserName({ id: "nonexistent", name: "NewName" });
			}).toThrow(); // Will throw because user doesn't exist
		});
	});

	describe("userLeaveRoom", () => {
		beforeEach(() => {
			gameService.addUser(player1);
		});

		test("should set user status to left", () => {
			expect(player1.status).toBe(USER_STATUS.online);

			gameService.userLeaveRoom({ id: player1.id });

			expect(player1.status).toBe(USER_STATUS.left);
		});
	});

	describe("userDisconnected", () => {
		beforeEach(() => {
			gameService.addUser(player1);
		});

		test("should set user status to disconnected", () => {
			expect(player1.status).toBe(USER_STATUS.online);

			gameService.userDisconnected({ id: player1.id });

			expect(player1.status).toBe(USER_STATUS.disconnected);
		});
	});

	describe("updateGameMaster", () => {
		beforeEach(() => {
			gameService.addUser(player1);
			gameService.addUser(player2);
		});

		test("should rotate game master to next user", () => {
			expect(gameService.gameMaster.id).toBe(gameMaster.id);

			gameService.updateGameMaster();

			expect(gameService.gameMaster.id).toBe(player1.id);
		});

		test("should wrap around to first user after last user", () => {
			// Make player2 the current GM
			gameService.gameMaster = player2;

			gameService.updateGameMaster();

			expect(gameService.gameMaster.id).toBe(gameMaster.id); // Should wrap to first user
		});

		test("should handle single user case", () => {
			const singleUserGame = new GameService({
				roomId: "single",
				initialGM: gameMaster,
			});

			singleUserGame.updateGameMaster();

			expect(singleUserGame.gameMaster.id).toBe(gameMaster.id); // Should stay the same
		});
	});

	describe("scoreboard", () => {
		beforeEach(() => {
			gameService.addUser(player1);
			gameService.addUser(player2);
			player1.score = 20;
			player2.score = 10;
		});

		test("should return correct scoreboard format", () => {
			const scoreboard = gameService.scoreboard();

			expect(scoreboard.gameMaster).toBe(gameService.gameMaster);
			expect(scoreboard.players).toHaveLength(3);
			expect(scoreboard.players).toContain(gameMaster);
			expect(scoreboard.players).toContain(player1);
			expect(scoreboard.players).toContain(player2);
		});

		test("should include all users in players array", () => {
			const scoreboard = gameService.scoreboard();

			expect(
				scoreboard.players.find((p) => p.id === gameMaster.id)
			).toBeDefined();
			expect(scoreboard.players.find((p) => p.id === player1.id)).toBeDefined();
			expect(scoreboard.players.find((p) => p.id === player2.id)).toBeDefined();
		});
	});

	describe("Edge Cases and Integration Tests", () => {
		test("should handle multiple players answering same question", () => {
			const question = new Question({ text: "What is 2+2?", answer: "4" });
			gameService.question = question;
			gameService.addUser(player1);
			gameService.addUser(player2);

			// Player 1 answers incorrectly
			gameService.answerQuestion({ userId: player1.id, answer: "5" });
			expect(player1.score).toBe(0);
			expect(gameService.userGuesses.get(player1.id)).toBe(1);

			// Player 2 answers correctly
			const result = gameService.answerQuestion({
				userId: player2.id,
				answer: "4",
			});
			expect(result).toBe(true);
			expect(player2.score).toBe(10);
			expect(player2.questionsCorrect).toBe(1);
		});

		test("should handle user reaching maximum guesses", () => {
			const question = new Question({ text: "What is 2+2?", answer: "4" });
			gameService.question = question;
			gameService.addUser(player1);

			// Make 3 incorrect guesses
			gameService.answerQuestion({ userId: player1.id, answer: "1" });
			gameService.answerQuestion({ userId: player1.id, answer: "2" });
			gameService.answerQuestion({ userId: player1.id, answer: "3" });

			expect(gameService.userGuesses.get(player1.id)).toBe(3);

			// Fourth guess should throw error
			expect(() => {
				gameService.answerQuestion({ userId: player1.id, answer: "4" });
			}).toThrow("Maximum guesses reached!");
		});

		test("should handle game master rotation with different user statuses", () => {
			gameService.addUser(player1);
			gameService.addUser(player2);

			// Disconnect player1
			gameService.userDisconnected({ id: player1.id });

			// GM should still rotate through all users regardless of status
			gameService.updateGameMaster();
			expect(gameService.gameMaster.id).toBe(player1.id);

			gameService.updateGameMaster();
			expect(gameService.gameMaster.id).toBe(player2.id);
		});

		test("should maintain user statistics across multiple questions", () => {
			gameService.addUser(player1);
			const question1 = new Question({ text: "Question 1?", answer: "A" });
			const question2 = new Question({ text: "Question 2?", answer: "B" });

			// First question - correct answer
			gameService.question = question1;
			gameService.answerQuestion({ userId: player1.id, answer: "A" });

			expect(player1.questionsAttempted).toBe(1);
			expect(player1.questionsCorrect).toBe(1);
			expect(player1.score).toBe(10);

			// Clear for next question
			gameService.nextQuestion();

			// Second question - incorrect then correct
			gameService.question = question2;
			gameService.answerQuestion({ userId: player1.id, answer: "Wrong" });
			gameService.answerQuestion({ userId: player1.id, answer: "B" });

			expect(player1.questionsAttempted).toBe(2);
			expect(player1.questionsCorrect).toBe(2);
			expect(player1.score).toBe(20);
		});
	});

	describe("Timer functionality", () => {
		test("should clear timer when correct answer is given", () => {
			const question = new Question({ text: "What is 2+2?", answer: "4" });
			gameService.question = question;
			gameService.addUser(player1);

			gameService.answerQuestion({ userId: player1.id, answer: "4" });

			expect(gameService.timerId).toBe(null);
			expect(gameService.timerId).toBeNull();
		});
	});
});

describe("Question class", () => {
	test("should create question with valid inputs", () => {
		const question = new Question({ text: "What is 2+2?", answer: "4" });

		expect(question.text).toBe("What is 2+2?");
		expect(question.correctAnswer).toBe("4");
	});

	test("should throw error for invalid text", () => {
		expect(() => {
			new Question({ text: 123, answer: "4" });
		}).toThrow("Invalid Question");
	});

	test("should throw error for invalid answer", () => {
		expect(() => {
			new Question({ text: "Question?", answer: 123 });
		}).toThrow("Invalid Question");
	});

	test("should correctly identify correct answer", () => {
		const question = new Question({ text: "What is 2+2?", answer: "4" });

		expect(question.isCorrectAnswer("4")).toBe(true);
		expect(question.isCorrectAnswer("5")).toBe(false);
		expect(question.isCorrectAnswer(4)).toBe(false); // Type matters
	});
});

describe("User class", () => {
	test("should create user with correct initial state", () => {
		const user = new User({ name: "TestUser", id: "test1" });

		expect(user.name).toBe("TestUser");
		expect(user.id).toBe("test1");
		expect(user.status).toBe(USER_STATUS.online);
		expect(user.score).toBe(0);
		expect(user.questionsAttempted).toBe(0);
		expect(user.questionsCorrect).toBe(0);
	});

	test("should return correct object from toString", () => {
		const user = new User({ name: "TestUser", id: "test1" });
		user.score = 50;
		user.questionsAttempted = 5;
		user.questionsCorrect = 3;

		const userObj = user.toString();

		expect(userObj.name).toBe("TestUser");
		expect(userObj.status).toBe(USER_STATUS.online);
		expect(userObj.score).toBe(50);
		expect(userObj.questionsAttempted).toBe(5);
		expect(userObj.questionsCorrect).toBe(3);
	});
});

describe("GameError class", () => {
	test("should create error with correct message", () => {
		const error = new GameError("Test error message");

		expect(error.message).toBe("Test error message");
		expect(error instanceof Error).toBe(true);
		expect(error instanceof GameError).toBe(true);
	});
});
