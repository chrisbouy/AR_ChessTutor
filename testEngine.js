// testEngine.js

import Engine from './engines/wukong.js';

const engine = new Engine();
engine.initialize();

// Set a specific board position (you can modify the FEN as needed)
const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
engine.setFEN(fen);

// Define search depth
const depth = 3; // Adjust depth as needed

// Search for the best moves
const topMoves = engine.searchPosition(depth, 1); // pvCount=1

// Display the moves and attributes
if (topMoves.length === 0) {
  console.log('No best moves found.');
} else {
  for (let moveInfo of topMoves) {
    const move = moveInfo.move;
    const from = Object.keys(engine.SQUARES).find(key => engine.SQUARES[key] === move.from);
    const to = Object.keys(engine.SQUARES).find(key => engine.SQUARES[key] === move.to);
    const promotion = move.promotion ? engine.PIECE_SYMBOLS[move.promotion] : '';
    console.log(`Move: ${from}${to}${promotion}`);
    console.log(`Score: ${moveInfo.score}`);
    console.log(`Attributes: ${moveInfo.attributes.join(', ')}`);
  }
}
