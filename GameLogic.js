import { Chess } from 'chess.js';
import TutorEngine from './engines/TutorEngine';

class GameLogic {
    constructor() {
        this.chess = new Chess();
        this.engine = null; // Will be initialized later
        this.latestAdvice = null;
    }

    initializeEngine() {
        try {
            if (!this.engine) {
                this.engine = new TutorEngine();
                if (this.chess) {
                    this.engine.setPosition(this.chess.fen());
                }
            }
        } catch (error) {
            console.error('Error in initializeEngine:', error);
            throw error;
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

    makeMove_White(move) {
        try {
            const result = this.chess.move(move);
            if (result) {
                this.engine.setPosition(this.chess.fen());
                console.log('Move made:', move);
                console.log('New FEN:', this.chess.fen());
                console.log('Side to move:', this.chess.turn() === 'w' ? 'White' : 'Black');
    
            }
            return result;
        } catch (error) {
            console.error('Error making move:', error);
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

    makeMove_Black() {
        try {
            this.engine.setPosition(this.chess.fen());
            const legalMoves = this.chess.moves({ verbose: true });
            
            if (!legalMoves.length) {
                console.log('No legal moves available for Black');
                return null;
            }
    
            // Get best move from engine
            const bestMove = this.engine.getBestMove_Black(2);
            
            if (!bestMove || !bestMove.move) {
                console.log('Engine failed to suggest a move - using principle-based move');
                // Use principle-based move instead of random
                return this.makePrincipledMove(legalMoves);
            }
    
            // Try to make the move directly
            const result = this.chess.move(bestMove.move);
            if (result) {
                return {
                    move: result,
                    boardState: this.getBoardState(),
                    status: this.getGameStatus()
                };
            }
    
            // If direct move failed, try using from/to
            const moveToMake = {
                from: bestMove.move.from,
                to: bestMove.move.to,
                promotion: bestMove.move.promotion
            };
    
            const result2 = this.chess.move(moveToMake);
            if (result2) {
                return {
                    move: result2,
                    boardState: this.getBoardState(),
                    status: this.getGameStatus()
                };
            }
    
            // If both attempts failed, use principle-based move
            console.log('Failed to make engine move - using principle-based move');
            return this.makePrincipledMove(legalMoves);
    
        } catch (error) {
            console.log('Error in makeMove_Black:', error);
            // Even on error, use principle-based move instead of random
            return this.makePrincipledMove(this.chess.moves({ verbose: true }));
        }
    }
    makePrincipledMove(legalMoves) {
        // Score moves based on basic chess principles
        const scoredMoves = legalMoves.map(move => {
            let score = 0;
            
            // Early game principles
            if (this.chess.moveNumber() <= 10) {
                // Develop knights to good squares
                if (move.piece === 'n') {
                    if (['c6', 'f6'].includes(move.to)) score += 100;  // Best knight squares
                    if (['e7', 'd6'].includes(move.to)) score += 50;   // OK knight squares
                    if (move.to.includes('a') || move.to.includes('h')) score -= 100; // Knights on rim
                }
                
                // Control center with pawns
                if (move.piece === 'p') {
                    if (['d5', 'e5'].includes(move.to)) score += 90;
                    if (['c5', 'f5'].includes(move.to)) score += 40;
                }
                
                // Develop bishops
                if (move.piece === 'b') {
                    if (['f5', 'g4', 'c5', 'd6'].includes(move.to)) score += 80;
                }
                
                // Penalize early queen moves
                if (move.piece === 'q') score -= 150;
            }
            
            // General principles
            if (move.captured) {
                const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
                score += pieceValues[move.captured] * 50;
                
                // Don't trade unless capturing higher value piece
                if (pieceValues[move.piece] > pieceValues[move.captured]) {
                    score -= 30;
                }
            }
            
            return { move, score };
        });
            // Sort by score and get best move
        scoredMoves.sort((a, b) => b.score - a.score);
        const bestMove = scoredMoves[0].move;
        
        // Make the move
        const result = this.chess.move(bestMove);
        
        return {
            move: result,
            boardState: this.getBoardState(),
            status: this.getGameStatus()
        };
    }
    findSafestMove(moves) {
        // Conservative move selection when main engine fails
        const scoredMoves = moves.map(move => {
            let score = 0;
            
            // Prefer developing moves in opening
            if (this.chess.moveNumber() < 10) {
                // Develop knights to good squares
                if (move.piece === 'n' && ['c6', 'f6'].includes(move.to)) {
                    score += 50;
                }
                
                // Develop center pawns
                if (move.piece === 'p' && ['d5', 'e5'].includes(move.to)) {
                    score += 40;
                }
                
                // Penalize early queen moves
                if (move.piece === 'q') {
                    score -= 100;
                }
            }
            
            // Avoid moving to edge of board
            if (move.to.includes('a') || move.to.includes('h')) {
                score -= 30;
            }
            
            // Avoid moving same piece twice in opening
            const history = this.chess.history({ verbose: true });
            if (this.chess.moveNumber() < 10 && 
                history.some(h => h.piece === move.piece && h.from === move.from)) {
                score -= 40;
            }
            
            return { move, score };
        });
        
        // Sort by score and return the best conservative move
        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves[0].move;
    }

    selectRandomMove() {
        const moves = this.chess.moves();
        if (moves.length === 0) return null;
        return moves[Math.floor(Math.random() * moves.length)];
    }

    getGameStatus() {
        if (this.chess.isCheckmate()) return 'checkmate';
        if (this.chess.isDraw()) return 'draw';
        return 'ongoing';
    }

    fetchAdviceAfterBlackMove() {
        if (this.chess.turn() !== 'w') {
            console.log('Not White\'s turn, skipping advice generation.');
            return null;
        }
        this.engine.setPosition(this.chess.fen());
        const engineAdvice = this.engine.getAdvice();
        
        if (!engineAdvice || engineAdvice.length === 0) {
            return {
                positionAnalysis: 'No analysis available',
                recommendedNextMoves: []
            };
        }
    
        const formattedAdvice = {
            positionAnalysis: `Position evaluation: ${this.engine.evaluatePosition()}`,
            recommendedNextMoves: engineAdvice.map(moveInfo => {
                // Determine priority based on score
                let priority;
                if (moveInfo.score >= 200) {
                    priority = 'STRONG';
                } else if (moveInfo.score >= 50) {
                    priority = 'GOOD';
                } else {
                    priority = 'MODERATE';
                }
    
                return {
                    move: moveInfo.move.san,
                    priority,
                    reasoning: moveInfo.reasoning.join(', '),
                    from: moveInfo.move.from,
                    to: moveInfo.move.to
                };
            })
        };
    
        return formattedAdvice;
    }
    

    convertMoveToDescription(sanMove, color) {
        const originalFEN = this.chess.fen();
        const tempChess = new Chess(originalFEN);

        // Set the correct side to move if needed
        if (color === 'b') {
            const fenParts = originalFEN.split(' ');
            fenParts[1] = 'b';
            tempChess.load(fenParts.join(' '));
        }

        const moves = tempChess.moves({ verbose: true });
        const move = moves.find(m => m.san === sanMove);

        if (!move) return sanMove;

        if (move.flags.includes('k') || move.flags.includes('q')) {
            const side = move.san === 'O-O' ? 'king-side' : 'queen-side';
            return `Castling ${side} from ${move.from.toUpperCase()} to ${move.to.toUpperCase()}`;
        }

        const pieceName = this.getPieceName(move.piece);
        const action = move.captured ? 'captures on' : 'to';
        const promotion = move.promotion ? ` and promotes to ${this.getPieceName(move.promotion)}` : '';
        
        return `${pieceName} from ${move.from.toUpperCase()} ${action} ${move.to.toUpperCase()}${promotion}`;
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

export default GameLogic;