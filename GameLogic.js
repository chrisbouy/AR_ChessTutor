import { Chess } from 'chess.js';
import { Alert } from 'react-native';
import Engine from './engines/wukong';

class GameLogic {
  constructor() {
    this.chess = new Chess();
    this.latestAdvice = null;
    this.engine = null; // Will be initialized later
  }

  initializeEngine() {
    this.engine = new Engine();
    this.engine.initialize();
  }

  getGameStatus() {
    if (this.chess.isCheckmate()) {
      return 'checkmate';
    } else if (this.chess.isDraw()) {
      return 'draw';
    } else {
      return 'ongoing';
    }
  }

  getBoardState() {
    const board = this.chess.board();
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    return board.map((row, rowIndex) => {
      return row.map((piece, colIndex) => {
        const position = files[colIndex] + (8 - rowIndex);
        const squareColor = (rowIndex + colIndex) % 2 === 0 ? '#c0dae6' : '#1594da';
        return {
          position,
          color: squareColor,
          piece: piece ? { type: piece.type, color: piece.color } : null,
        };
      });
    });
  }

  makeMove(move) {
    try {
      const result = this.chess.move(move);
      return result || null;
    } catch (error) {
      return null;
    }
  }

  getPieceAt(position) {
    const rowIndex = 8 - parseInt(position[1]);
    const colIndex = position.charCodeAt(0) - 'a'.charCodeAt(0);
    const piece = this.chess.board()[rowIndex][colIndex];
    return piece ? { type: piece.type, color: piece.color } : null;
  }

  getLegalMoves(position) {
    return this.chess.moves({ square: position, verbose: true });
  }

  getBestMovesFromEngine() {
    const fen = this.chess.fen();
    this.engine.setFEN(fen);
    const depth = 4;
    const topMoves = this.engine.searchPosition(depth, 3);

    const processedMoves = topMoves.map((moveInfo) => {
      const move = moveInfo.move;
      const fromSquare = Object.keys(this.engine.SQUARES).find(
        (key) => this.engine.SQUARES[key] === move.from
      );
      const toSquare = Object.keys(this.engine.SQUARES).find(
        (key) => this.engine.SQUARES[key] === move.to
      );
      const promotion = move.promotion ? this.engine.PIECE_SYMBOLS[move.promotion] : '';
      const uciMove = fromSquare + toSquare + promotion;
      const sanMove = this.convertMoveToSAN(uciMove);
      return {
        move: sanMove,
        score: moveInfo.score,
        attributes: moveInfo.attributes,
        from: fromSquare,
        to: toSquare,
        uci: uciMove,
      };
    });
    return processedMoves;
  }

  convertMoveToSAN(uciMove) {
    const move = this.chess.move(uciMove, { sloppy: true });
    if (move) {
      const san = move.san;
      this.chess.undo();
      return san;
    }
    return uciMove;
  }

  makeMove_Black() {
    try {
      const bestMoves = this.getBestMovesFromEngine();
      if (bestMoves.length === 0) {
        return null;
      }
      const bestMove = bestMoves[0];
      const moveResult = this.chess.move(bestMove.move, { sloppy: true });
      if (moveResult) {
        return {
          move: moveResult,
          boardState: this.getBoardState(),
          status: this.getGameStatus(),
          uci: moveResult.from + moveResult.to,
          san: moveResult.san,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.log('Error in makeMove_Black:', error);
      return null;
    }
  }

  selectRandomMove() {
    const possibleMoves = this.chess.moves();
    if (possibleMoves.length === 0) {
      console.log('No legal moves available.');
      return null;
    }
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }

  getAdvice() {
    const bestMoves = this.getBestMovesFromEngine();
    const evaluation = this.engine.evaluate();
    const advice = {
      positionAnalysis: `Engine evaluation: ${evaluation}`,
      recommendedNextMoves: bestMoves.map((move) => ({
        move: move.move,
        priority: 'STRONG',
        reasoning: move.attributes.join(', ') || 'No specific reasoning.',
        blackResponses: [],
        from: move.from,
        to: move.to,
      })),
    };
    return advice;
  }

  fetchAdviceAfterBlackMove() {
    const advice = this.getAdvice();
    return advice;
  }

  convertMoveToDescription(sanMove, color) {
    const originalFEN = this.chess.fen();

    let modifiedFEN = originalFEN;
    if (color === 'b') {
      const fenParts = originalFEN.split(' ');
      fenParts[1] = 'b';
      modifiedFEN = fenParts.join(' ');
    } else if (color === 'w') {
      const fenParts = originalFEN.split(' ');
      fenParts[1] = 'w';
      modifiedFEN = fenParts.join(' ');
    }

    const tempChess = new Chess(modifiedFEN);

    const moves = tempChess.moves({ verbose: true });

    const move = moves.find((m) => m.san === sanMove);

    if (move) {
      if (move.flags.includes('k') || move.flags.includes('q')) {
        const side = move.san === 'O-O' ? 'king-side' : 'queen-side';
        const from = move.from.toUpperCase();
        const to = move.to.toUpperCase();
        return `Castling ${side} from ${from} to ${to}`;
      } else {
        const pieceName = this.getPieceName(move.piece);
        const from = move.from.toUpperCase();
        const to = move.to.toUpperCase();
        const action = move.captured ? 'captures on' : 'to';
        const promotion = move.promotion ? ` and promotes to ${this.getPieceName(move.promotion)}` : '';
        return `${pieceName} from ${from} ${action} ${to}${promotion}`;
      }
    }

    return sanMove;
  }

  getPieceName(pieceSymbol) {
    const pieceNames = {
      p: 'Pawn',
      n: 'Knight',
      b: 'Bishop',
      r: 'Rook',
      q: 'Queen',
      k: 'King',
    };
    return pieceNames[pieceSymbol.toLowerCase()] || 'Piece';
  }
}

export default GameLogic;
