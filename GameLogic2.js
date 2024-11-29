import { Chess } from 'chess.js';
import { Alert } from 'react-native';
import Engine from './engines/wukong.js';

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
      this.engine.setFEN(this.chess.fen());
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
    const depth = 4; // Increased depth for better analysis
    
    const moves = this.engine.searchPosition(depth);
    if (!moves || moves.length === 0) return [];
    
    return moves.map(moveInfo => {
        if (!moveInfo || !moveInfo.move) return null;
        
        // Get the squares from wukong's SQUARES object directly
        const from = Object.keys(this.engine.SQUARES).find(
            key => this.engine.SQUARES[key] === moveInfo.move.from
        );
        const to = Object.keys(this.engine.SQUARES).find(
            key => this.engine.SQUARES[key] === moveInfo.move.to
        );
        
        if (!from || !to) return null;
        
        // Validate the move with chess.js before returning it
        try {
            const testMove = { from, to };
            if (moveInfo.move.promotion) {
                testMove.promotion = this.engine.PIECE_SYMBOLS[moveInfo.move.promotion].toLowerCase();
            }
            
            // Test if move is legal
            const testChess = new Chess(this.chess.fen());
            if (!testChess.move(testMove)) return null;
            
            return {
                move: from + to + (testMove.promotion || ''),
                score: moveInfo.score,
                attributes: moveInfo.attributes,
                from: from,
                to: to
            };
        } catch (e) {
            return null;
        }
    }).filter(move => move !== null);
}
  
  indexToAlgebraic(index) {
    const file = index & 7;
    const rank = 8 - (index >> 4); // Ensure rank is calculated correctly
    if (file < 0 || file > 7 || rank < 1 || rank > 8) {
        console.log(`Invalid index for algebraic conversion: ${index}`);
        return null;
    }
    return 'abcdefgh'[file] + rank;
}

  
  


 convertMoveToSAN(move) {
  const fromSquare = this.indexToAlgebraic[move.from];
  const toSquare = this.indexToAlgebraic[move.to];
  const promotion = move.promotion ? pieceSymbols[move.promotion] : '';

  return fromSquare + toSquare + promotion;
}


makeMove_Black() {
  const moves = this.getBestMovesFromEngine();
  
  if (!moves.length) {
      console.log('No valid engine moves available');
      return null;
  }

  // Sort moves by score to ensure we try the best moves first
  moves.sort((a, b) => b.score - a.score);

  // Try each move
  for (const moveInfo of moves) {
      try {
          const moveObj = {
              from: moveInfo.from,
              to: moveInfo.to
          };
          
          if (moveInfo.move.length > 4) { // Has promotion
              moveObj.promotion = moveInfo.move[4];
          }
          
          const moveResult = this.chess.move(moveObj);
          if (moveResult) {
              // Update engine's position
              this.engine.setFEN(this.chess.fen());
              
              return {
                  move: moveResult,
                  boardState: this.getBoardState(),
                  status: this.getGameStatus()
              };
          }
      } catch (e) {
          console.log('Move failed:', moveInfo.move);
      }
  }

  return null;
}


  selectRandomMove() {
    const possibleMoves = this.chess.moves();
    console.log(`Possible random moves: ${JSON.stringify(possibleMoves)}`);

    if (possibleMoves.length === 0) {
      console.log('No legal moves available.');
      return null;
    }
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    const randomMove = possibleMoves[randomIndex];
    console.log(`Selected random move: ${randomMove}`);
  
    return possibleMoves[randomIndex];
  }

  getAdvice() {
    const bestMoves = this.getBestMovesFromEngine();
    const evaluation = this.engine.evaluate();

    // Filter out any moves that aren't legal
    const legalMoves = bestMoves.filter(move => {
        try {
            const testChess = new Chess(this.chess.fen());
            return testChess.move({from: move.from, to: move.to});
        } catch (e) {
            return false;
        }
    });

    return {
        positionAnalysis: `Engine evaluation: ${evaluation}`,
        recommendedNextMoves: legalMoves.map((move) => ({
            move: move.move,
            priority: move.score > 0 ? 'STRONG' : 'MODERATE',
            reasoning: move.attributes.join(', ') || 'Position improvement',
            blackResponses: [],
            from: move.from,
            to: move.to,
        }))
    };
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
