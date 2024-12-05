import { Chess } from 'chess.js';

export default class TutorEngine {
    constructor(chessInstance) {
        if (!chessInstance) {
            throw new Error('A Chess instance must be provided to TutorEngine.');
        }
        this.chess = chessInstance; // Use the shared Chess instance
        
        // Core piece values
        this.PIECE_VALUES = {
            p: 100,  // pawn
            n: 300,  // knight
            b: 310,  // bishop
            r: 500,  // rook
            q: 900,  // queen
            k: 20000 // king
        };

        // Opening development squares
        this.DEVELOPMENT_SQUARES = {
            w: { // White's good development squares
                n: ['f3', 'c3'],     // knights
                b: ['c4', 'f4', 'g5', 'd3'], // bishops
                p: ['d4', 'e4']      // central pawns
            },
            b: { // Black's good development squares
                n: ['f6', 'c6'],     // knights
                b: ['c5', 'f5', 'g4', 'd6'], // bishops
                p: ['d5', 'e5']      // central pawns
            }
        };

        // Center squares for positional evaluation
        this.CENTER_SQUARES = ['d4', 'd5', 'e4', 'e5'];
        this.EXTENDED_CENTER = ['c3', 'c4', 'c5', 'c6', 'd3', 'd4', 'd5', 'd6', 
                              'e3', 'e4', 'e5', 'e6', 'f3', 'f4', 'f5', 'f6'];
    }

    setPosition(fen) {
        if (!fen) return;
        try {
            this.chess.load(fen);
        } catch (error) {
            console.error('Error setting position:', error);
        }
    }
    evaluatePosition(move) {
        const pieces = this.getAllPieces();
        let score = 0;
        this.chess.move(move.san);
        // Material evaluation (weighted more heavily)
        const materialScore = this.evaluateMaterial(pieces);
        // console.log(`Material Score: ${materialScore}`);
        score += materialScore * 2; // Double weight for material
        // Positional evaluation
        const positionalScore = this.evaluatePositional(pieces);
        // console.log(`Positional Score: ${positionalScore}`);
        score += positionalScore;
        // Trade evaluation - only encourage trades if ahead in material
        const tradeScore = this.evaluateTrades();
        // console.log(`Trade Score: ${tradeScore}`);
        if (materialScore > 200) { // Significant material advantage
          score += tradeScore * 0.5;
        } else {
          score -= tradeScore; // Discourage trades when not ahead
        }
        //console.log(`Total Evaluation Score: ${this.chess.turn() === 'w' ? score : -score}`);
        this.chess.undo();     
        console.log('positional score ', score);   
        return this.chess.turn() === 'w' ? score : -score;

      }
      
      evaluateMoveSafety(move) {
        let score = 0;
        console.log(`fen at eval safety for move ${move.san} ${this.chess.fen()}`);
        // Make the move to analyze resulting position
        this.chess.move(move.san);
        // Check if the moved piece can be captured
        const attackers = this.findAttackers(move.to);
        const defenders = this.findDefenders(move.to);
        if (attackers.length > 0) {
          // Basic piece safety evaluation
          console.log(`attackers: ${attackers.map(a => a.piece)}`);
        //   console.log(`lowestAttackerValue: ${lowestAttackerValue}`);
        //   console.log(`strongestDefenderValue: ${strongestDefenderValue}`);
          const pieceValue = this.PIECE_VALUES[move.piece];
          const lowestAttackerValue = Math.min(...attackers.map(a => this.PIECE_VALUES[a.piece]));
          // Heavy penalty for hanging pieces
          if (defenders.length === 0) {

            score -= pieceValue * 2; // Double penalty for completely hanging pieces
            console.log(`Hanging piece at ${move.to}, Penalty: ${pieceValue * 2}`);
          } else {  
            console.log(`defenders: ${defenders.map(d => d.piece)}`);
            // Evaluate exchange
            const strongestDefenderValue = Math.max(...defenders.map(d => this.PIECE_VALUES[d.piece]));
            if (lowestAttackerValue < pieceValue && strongestDefenderValue < lowestAttackerValue) {
              score -= pieceValue; // Penalty for moving into unfavorable exchange
              console.log(`Unfavorable exchange at ${move.to}, Penalty: ${pieceValue}`);
            }
          }
          // Extra penalty for unsafe bishop moves
          if (move.piece === 'b' && defenders.length === 0) {
            score -= 150; // Extra penalty for hanging bishop
            console.log(`Hanging bishop at ${move.to}, Penalty: 150`);
          }
        }
        // Undo the move
        this.chess.undo();
        console.log('move safety score ', score);
        return score
      }
      

    findDefenders(square) {
        // Identify the piece on the square
        const pieceOnSquare = this.chess.get(square);
        if (!pieceOnSquare) return [];
      
        const pieceColor = pieceOnSquare.color; // 'w' or 'b'
      
        // Modify FEN so that pieceColor is to move
        let fenParts = this.chess.fen().split(' ');
        fenParts[1] = pieceColor; // Set turn to the piece’s color
        const fenForDefenders = fenParts.join(' ');
      
        const tempChess = new Chess(fenForDefenders);
        const moves = tempChess.moves({ verbose: true });
        const defenders = [];
      
        for (let m of moves) {
          if (m.to === square) {
            const p = tempChess.get(m.from);
            if (p && p.color === pieceColor) {
              defenders.push({ piece: p.type, square: m.from });
            }
          }
        }
      
        return defenders;
      }
      
      findAttackers(square) {
        // Identify the piece on the square
        const pieceOnSquare = this.chess.get(square);
        if (!pieceOnSquare) return [];
      
        const victimColor = pieceOnSquare.color; 
        const attackerColor = (victimColor === 'w') ? 'b' : 'w';
      
        // Modify FEN so that attackerColor is to move
        let fenParts = this.chess.fen().split(' ');
        fenParts[1] = attackerColor;
        const fenForAttackers = fenParts.join(' ');
      
        const tempChess = new Chess(fenForAttackers);
        const moves = tempChess.moves({ verbose: true });
        const attackers = [];
      
        for (let m of moves) {
          if (m.to === square) {
            const p = tempChess.get(m.from);
            if (p && p.color === attackerColor) {
              attackers.push({ piece: p.type, square: m.from });
            }
          }
        }
      
        return attackers;
      }
      
      
      
    getAllPieces() {
        const pieces = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.chess.board()[row][col];
                if (piece) {
                    const square = 'abcdefgh'[col] + (8 - row);
                    pieces.push({ ...piece, square });
                }
            }
        }
        return pieces;
    }
    evaluateMaterial(pieces) {
        return pieces.reduce((score, piece) => {
            const value = this.PIECE_VALUES[piece.type];
            return score + (piece.color === 'w' ? value : -value);
        }, 0);
    }
    evaluateOpening(pieces, moveHistory) {
        let score = 0;

        pieces.forEach(piece => {
            const multiplier = piece.color === 'w' ? 1 : -1;
            
            // 1. Development of pieces
            if (piece.type === 'n' || piece.type === 'b') {
                const developmentSquares = this.DEVELOPMENT_SQUARES[piece.color][piece.type];
                if (developmentSquares.includes(piece.square)) {
                    score += 50 * multiplier;
                }
            }

            // 2. Center control
            if (this.CENTER_SQUARES.includes(piece.square)) {
                score += 30 * multiplier;
            } else if (this.EXTENDED_CENTER.includes(piece.square)) {
                score += 15 * multiplier;
            }

            // 3. Early game penalties
            if (moveHistory.length < 10) {
                // Penalize early queen moves
                if (piece.type === 'q' && piece.square !== 'd1' && piece.square !== 'd8') {
                    score -= 100 * multiplier;
                }
                
                // Penalize undeveloped knights/bishops
                if ((piece.type === 'n' || piece.type === 'b') && 
                    piece.square[1] === (piece.color === 'w' ? '1' : '8')) {
                    score -= 30 * multiplier;
                }
            }
        });

        return score;
    }
    evaluateTrades() {
        const moves = this.chess.moves({ verbose: true });
        let tradeScore = 0;
    
        moves.forEach(move => {
            if (move.captured) {
                const pieceValue = this.PIECE_VALUES[move.piece];
                const capturedValue = this.PIECE_VALUES[move.captured];
                
                // Only count favorable or equal trades
                if (capturedValue >= pieceValue) {
                    tradeScore += (capturedValue - pieceValue);
                } else {
                    tradeScore -= (pieceValue - capturedValue) * 2; // Penalize unfavorable trades
                }
            }
        });
    
        return tradeScore;
    }
    evaluateMiddlegame(pieces) {
        let score = 0;

        pieces.forEach(piece => {
            const multiplier = piece.color === 'w' ? 1 : -1;
            
            // 1. Piece positioning
            if (piece.type === 'n') {
                // Knights on the rim are dim
                if (piece.square[0] === 'a' || piece.square[0] === 'h') {
                    score -= 30 * multiplier;
                }
            }

            // 2. King safety
            if (piece.type === 'k') {
                if (this.isKingSafe(piece)) {
                    score += 50 * multiplier;
                }
            }

            // 3. Rook positioning
            if (piece.type === 'r') {
                if (this.isRookOnOpenFile(piece)) {
                    score += 30 * multiplier;
                }
            }
        });

        return score;
    }
    evaluatePositional(pieces) {
        let score = 0;
        const isEarlyGame = this.chess.moveNumber() < 10;
    
        pieces.forEach(piece => {
            const multiplier = piece.color === 'w' ? 1 : -1;
    
            if (isEarlyGame) {
                // Development
                if ((piece.type === 'n' || piece.type === 'b') && 
                    this.DEVELOPMENT_SQUARES[piece.color][piece.type].includes(piece.square)) {
                    score += 30 * multiplier;
                }
    
                // Center control
                if (this.CENTER_SQUARES.includes(piece.square)) {
                    score += 20 * multiplier;
                }
    
                // Early queen moves (smaller penalty, relative to material value)
                if (piece.type === 'q' && 
                    ((piece.color === 'w' && piece.square !== 'd1') || 
                     (piece.color === 'b' && piece.square !== 'd8'))) {
                    score -= 50 * multiplier;
                }
    
                // Knights on rim
                if (piece.type === 'n' && 
                    (piece.square.includes('a') || piece.square.includes('h'))) {
                    score -= 40 * multiplier;
                }
            }
    
            // King safety
            if (piece.type === 'k') {
                if (this.isKingSafe(piece)) {
                    score += 40 * multiplier;
                }
            }
        });
    
        return score;
    }
    isKingSafe(kingPiece) {
        // Consider king safe if castled or well protected
        const rank = kingPiece.square[1];
        const backRank = kingPiece.color === 'w' ? '1' : '8';
        return rank === backRank && this.hasPawnShield(kingPiece);
    }
    hasPawnShield(kingPiece) {
        const file = kingPiece.square[0];
        const rank = kingPiece.color === 'w' ? '2' : '7';
        const adjacentFiles = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
            .filter(f => Math.abs(f.charCodeAt(0) - file.charCodeAt(0)) <= 1);
        
        return adjacentFiles.some(f => {
            const square = f + rank;
            const piece = this.chess.get(square);
            return piece && piece.type === 'p' && piece.color === kingPiece.color;
        });
    }
    isRookOnOpenFile(rookPiece) {
        const file = rookPiece.square[0];
        for (let rank = 1; rank <= 8; rank++) {
            const square = file + rank;
            const piece = this.chess.get(square);
            if (piece && piece.type === 'p') {
                return false;
            }
        }
        return true;
    }
    getBestMoves(numMoves = 1) {
         console.log(`fen in engine.getbestmoves before move:        ${this.chess.fen()}`);
        const moves = this.chess.moves({ verbose: true });
        if (!moves.length) return null;
        const originalFEN = this.chess.fen();
        const scoredMoves = moves.map((move) => {
            //this.chess.move(move);
            const score =
            (-this.evaluatePosition(move) * 1.5) + (this.evaluateMoveSafety(move) * 2);
                      //this.chess.undo();
         // this.chess.load(originalFEN);
            return { move, score };
        });
    // console.log(`fen in engine.getbestmoves after undoing move: ${this.chess.fen()}`);
        return scoredMoves
            .sort((a, b) => b.score - a.score)
            .slice(0, numMoves); // Return top `numMoves` moves
    }


    getMoveReasoning(move, score) {
        const reasons = [];
        const isEarlyGame = this.chess.history().length < 20;

        if (move.captured) {
            reasons.push(`Captures opponent's ${this.getPieceName(move.captured)}`);
        }

        if (isEarlyGame) {
            if (this.CENTER_SQUARES.includes(move.to)) {
                reasons.push('Controls central square');
            }
            if ((move.piece === 'n' || move.piece === 'b') && 
                this.DEVELOPMENT_SQUARES[this.chess.turn()][move.piece].includes(move.to)) {
                reasons.push('Develops piece to good square');
            }
            if (move.flags.includes('k') || move.flags.includes('q')) {
                reasons.push('Castling improves king safety');
            }
        }

        if (reasons.length === 0) {
            reasons.push(score > 100 ? 'Improves position significantly' : 
                        score > 0 ? 'Slightly improves position' : 
                        'Maintains position');
        }

        return reasons;
    }

    getPieceName(pieceSymbol) {
        const pieceNames = {
            p: 'Pawn',
            n: 'Knight',
            b: 'Bishop',
            r: 'Rook',
            q: 'Queen',
            k: 'King'
        };
        return pieceNames[pieceSymbol.toLowerCase()] || 'Piece';
    }
}