import { Chess } from 'chess.js';
import TutorEngine from './engines/TutorEngine';

class GameLogic {
    constructor() {
        this.chess = new Chess();
        this.engine = null; // Will be initialized later
        this.latestAdvice = null;
    }

    initializeEngine() {
        this.engine = new TutorEngine();
        this.engine.setPosition(this.chess.fen());
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
            if (result) {
                this.engine.setPosition(this.chess.fen());
            }
            return result;
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

    makeMove_Black() {
        try {
            this.engine.setPosition(this.chess.fen());
            const bestMove = this.engine.getBestMove(2); // Reduced depth
            
            if (!bestMove || !bestMove.move) {
                return null;
            }
    
            const result = this.chess.move(bestMove.move);
            if (!result) {
                return null;
            }
    
            return {
                move: result,
                boardState: this.getBoardState(),
                status: this.getGameStatus()
            };
        } catch (error) {
            console.log('Error in makeMove_Black:', error);
            return null;
        }
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
        this.engine.setPosition(this.chess.fen());
        const engineAdvice = this.engine.getAdvice();
        
        if (!engineAdvice || engineAdvice.length === 0) {
            console.log('No advice generated');
            return {
                positionAnalysis: 'No analysis available',
                recommendedNextMoves: []
            };
        }
    
        const formattedAdvice = {
            positionAnalysis: `Position evaluation: ${this.engine.evaluatePosition()}`,
            recommendedNextMoves: engineAdvice.map(moveInfo => ({
                move: moveInfo.move.san,
                priority: moveInfo.score > 50 ? 'STRONG' : 'MODERATE',
                reasoning: moveInfo.reasoning.join(', '),
                from: moveInfo.move.from,
                to: moveInfo.move.to
            }))
        };
    
        console.log('Generated advice:', formattedAdvice);
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