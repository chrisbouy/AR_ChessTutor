// const { Engine } = require('./wukong');
// const chessEngine = new Engine();

// export default class ChessEngine {
//     constructor() {
//         this.engine = new Engine(); // Initialize the engine
//     }

//     loadPosition(fen) {
//         this.engine.setBoard(fen);
//         this.engine.updateBoard();
//     }

//     getBestMove() {
//         const move = this.engine.search(5); // Search depth 5
//         return this.engine.moveToString(move);
//     }

//     isValidMove(move) {
//         return this.engine.isValid(move) !== 0;
//     }
// }