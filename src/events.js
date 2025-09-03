module.exports = {
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
    game$rooms: "game$active_room"
};
