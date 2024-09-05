import { Chess } from 'chess.js';

class GameLogic {
  constructor() {
    this.chess = new Chess();
  }

  getGameStatus() {
    return this.chess.isCheckmate() ? 'checkmate' : this.chess.isDraw() ? 'draw' : 'ongoing';
  }

  getBoardState() {
    const board = this.chess.board();
    return board.map((row) =>
      row.map((piece) =>
        piece
          ? { type: piece.type, color: piece.color }
          : null
      )
    );
  }

  makeMove(fromSquare, toSquare) {
    try {
      const move = this.chess.move({ from: fromSquare, to: toSquare });
      if (move) {
        console.log("Move was successful:", move);
        return move; // Return the move object if successful
      } else {
        console.log("Invalid move attempted:", fromSquare, "to", toSquare);
        return null; // Return null if the move was invalid
      }
    } catch (error) {
      console.log("Invalid move caught from chess.js:", error.message);
      return null; // Return null if chess.js throws an error
    }
  }
  

  makeAIMove() {
    const possibleMoves = this.chess.moves();
    if (possibleMoves.length === 0) {
      return null;
    }
    const randomMove = this.selectBestMove(possibleMoves);
    this.chess.move(randomMove);
    return {
      move: this.chess.history({ verbose: true }).slice(-1)[0],
      boardState: this.getBoardState(),
      status: this.getGameStatus(),
    };
  }

  selectBestMove(possibleMoves) {
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }
}

export default GameLogic;