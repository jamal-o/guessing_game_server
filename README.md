# Guessing Game

A real-time multiplayer guessing game where players take turns being the game master and creating questions for others to answer.

## Project Structure

The project consists of two main components:

- `guessing_game_client/`: A Flutter-based client application
- `guessing_game_server/`: A Node.js-based WebSocket server

## Features

- Real-time multiplayer gameplay using WebSocket connections
- Chat functionality between players
- Room-based game sessions
- Score tracking and leaderboard
- Role-based gameplay (Game Master and Players)
- Multiple guess attempts per question
- Timed questions with automatic timeouts

## Server Setup

### Prerequisites

- Node.js
- npm

### Installation

1. Navigate to the server directory:

```bash
cd guessing_game_server
```

2. Install dependencies:

```bash
npm install
```

3. Create environment files:

- `.env.development` for development
- `.env.production` for production

Required environment variables:

- `PORT`: Server port (default: 3000)
- `CLIENT_URL`: URL of the Flutter client

4. Start the server:

```bash
npm start
```

## Client Setup

### Prerequisites

- Flutter SDK
- Dart SDK

### Installation

1. Navigate to the client directory:

```bash
cd guessing_game_client/guessing_game
```

2. Get Flutter dependencies:

```bash
flutter pub get
```

3. Run the application:

```bash
flutter run
```

## Game Rules

1. One player becomes the Game Master and creates a question with an answer
2. Other players have 3 attempts to guess the correct answer
3. Players earn 10 points for correct answers
4. Questions have a time limit (default: 60 seconds)
5. Game Master role rotates among players after each question
6. Players can chat during the game

## Technical Details

### Server

- Built with Node.js and Socket.IO
- Implements room management and game state handling
- Manages user sessions and scoring
- Handles real-time communication and event broadcasting

### Client

- Built with Flutter
- Implements responsive UI for both web and mobile
- Real-time updates using WebSocket connections
- Features chat window and scoreboard widgets

## Socket Events

Key events used in the application:

- `user$create_game`: Create a new game room
- `user$join_room`: Join an existing room
- `user$add_question`: Add a new question (Game Master only)
- `player$guess`: Submit an answer
- `user$chat`: Send chat messages
- `game$question_timeout`: Question time limit reached
- `game$update_scoreboard`: Update player scores

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Socket.IO for real-time communication
- Flutter for cross-platform client development
