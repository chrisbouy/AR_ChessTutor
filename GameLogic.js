import { Chess } from 'chess.js';
import TutorEngine from './engines/TutorEngine';
import { validateFen } from "chess.js";

class GameLogic {
    constructor() {
        this.chess = new Chess();
        this.engine = new TutorEngine(this.chess); // Pass the Chess instance to the engine
        this.latestAdvice = null;
    }

    initializeEngine() {
        if (!this.engine) {
            this.engine = new TutorEngine(this.chess); // Ensure the engine uses the shared instance
        }
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

    makeMove_White(move) {
        try {
            console.log(`fen in logic.makemovewhite before move: ${this.chess.fen()}`);

            const result = this.chess.move(move);
            console.log(`fen in logic.makemovewhite after move:  ${this.chess.fen()}`);

            if (result) {
                this.engine.setPosition(this.chess.fen());
                // console.log('White move made:', move);
                // console.log('New FEN after white:', this.chess.fen());
                // console.log('Side to move:', this.chess.turn() === 'w' ? 'White' : 'Black');
    
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

    makeMove_Black(whiteMove) {
        const originalFEN = this.chess.fen();
    
        // Check if White's move is one of the advised moves
        const advisedMove = this.latestAdvice?.find(advice => advice.move.san === whiteMove);
        if (advisedMove) {
            // White's move matches advice; pick one of the likely responses
            const blackResponses = advisedMove.likelyResponses;
            const selectedMove = blackResponses[Math.floor(Math.random() * blackResponses.length)];
            console.log(`fen in logic.makemoveblack before script move: ${this.chess.fen()}`);

            this.chess.move(selectedMove.move); // Make Black's response
            console.log(`fen in logic.makemoveblack after script move: ${this.chess.fen()}`);

            return {
                move: selectedMove.move,
                boardState: this.getBoardState(),
                status: this.getGameStatus(),
            };
        } else {
            // White's move does not match advice; calculate the best move dynamically
            const bestMove = this.engine.getBestMoves(1)[0];
            console.log(`fen in logic.makemoveblack before off-script move: ${this.chess.fen()}`);
            this.chess.move(bestMove.move);
            console.log(`fen in logic.makemoveblack after off-script move:  ${this.chess.fen()}`);
            // console.log(`black moves: ${bestMove.move.san}`);
            // console.log(`new fen in makeblackmove: ${this.chess.fen()}`);            
            return {
                move: bestMove.move,
                boardState: this.getBoardState(),
                status: this.getGameStatus(),
            };
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
        console.log(`fen in logic.makeprincipaledmove before move: ${this.chess.fen()}`);

        // Make the move
        const result = this.chess.move(bestMove);
        console.log(`fen in logic.makeprincipalmove after  move: ${this.chess.fen()}`);

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

    getTableData() {
        const originalFEN = this.chess.fen();
       
        // Step 1: Get top 3 moves for White
        const topWhiteMoves = this.engine.getBestMoves(3);
    // console.log(`white move 1: ${topWhiteMoves[0].move.san}`);
    // console.log(`white move 2: ${topWhiteMoves[1].move.san}`);
    // console.log(`white move 3: ${topWhiteMoves[2].move.san}`);


        // Step 2: For each move, get likely Black responses
        const tableData = topWhiteMoves.map((whiteMove) => {
            console.log(`fen in logic.gettabledata before temp move:        ${this.chess.fen()}`);

            this.chess.move(whiteMove.move); // Temporarily make the White move
            const fenAfterWhiteMove = this.chess.fen();
            const likelyResponses = this.engine.getBestMoves(2); // Get top 2 Black moves
            this.chess.undo();
           // this.chess.load(originalFEN); // Restore FEN
            console.log(`fen in logic.gettabledata after undoing temp move: ${this.chess.fen()}`);

            //  console.log(`move: ${whiteMove.move.san}`);
            // console.log(`reasoning:  ${this.attachAttributes(whiteMove)}`);
            // console.log(`likelyResponses:  ${likelyResponses.map((response) => response.move.san)}`);

            return {
                move: whiteMove.move.san,
                reasoning: this.attachAttributes(whiteMove),
                likelyResponses: likelyResponses.map((response) => response.move.san),
            };
        });
    
        return tableData.filter(row => row !== null);;
    }
    
    attachAttributes(moveInfo) {
        const reasoning = [];
        if (moveInfo.move.captured) {
            reasoning.push(`Captures opponent's ${this.engine.getPieceName(moveInfo.move.captured)}`);
        }
        if (this.engine.CENTER_SQUARES.includes(moveInfo.move.to)) {
            reasoning.push('Controls a central square');
        }
        if (moveInfo.score > 100) {
            reasoning.push('Significant positional advantage');
        }
        return reasoning.join(', ');
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