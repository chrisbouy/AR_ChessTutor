import { Chess } from 'chess.js';
import Engine from './engines/wukong.js';
import { validateFen } from "chess.js";

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
            this.engine.setFEN(this.chess.fen());
            // console.log(`fen in logic.makemovewhite after move:  ${this.chess.fen()}`);

            if (result) {
                this.engine.setFEN(this.chess.fen());
                // console.log(`White move made: ${result.san}`);
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
        // console.log('Current FEN:', this.chess.fen());

        // console.log('Legal Moves for position', position, ':', this.chess.moves({ square: position }));

        return this.chess.moves({ square: position, verbose: true });
    }

    makeMove_Black(whiteMove) {
        const originalFEN = this.chess.fen();

        // Check if White's move is one of the advised moves
        const advisedMove = this.latestAdvice?.find(advice => advice.san === whiteMove);
        // console.log(`latestadvice: ${JSON.stringify(this.latestAdvice,null,2)}`);        
       
        // console.log(`white move: ${JSON.stringify(whiteMove,null,2)}`);        
        // console.log(`advised move: ${JSON.stringify(advisedMove,null,2)}`);
        if (advisedMove) {
            // White's move matches advice; pick one of the likely responses
            const blackResponses = advisedMove.likelyResponses;
            const selectedMove = blackResponses[Math.floor(Math.random() * blackResponses.length)];
            // console.log(`fen in logic.makemoveblack before script move: ${this.chess.fen()}`);

            const result=this.chess.move(selectedMove.move); // Make Black's response
            this.engine.setFEN(this.chess.fen());
            // console.log(`Black move made: ${result.san}`);
            // console.log(`fen in logic.makemoveblack after script move: ${this.chess.fen()}`);

            return {
                move: selectedMove.move,
                boardState: this.getBoardState(),
                status: this.getGameStatus(),
            };
        } else {
        //    console.log(`White's move does not match advice; calculate the best move dynamically`);
            const bestMove = this.engine.searchPosition(3)[0];
            // console.log('result from searchPosition:', JSON.stringify(bestMove, null, 2));
            // Convert numeric indices to algebraic notation
            const fromAlgebraic = this.indexToAlgebraic(bestMove.move.from);
            const toAlgebraic = this.indexToAlgebraic(bestMove.move.to);
            // console.log(`Converting from ${bestMove.move.from} to ${fromAlgebraic}`);
            // console.log(`Converting to ${bestMove.move.to} to ${toAlgebraic}`);
            const result=this.chess.move({ from: fromAlgebraic, to: toAlgebraic });
            this.engine.setFEN(this.chess.fen());
            // console.log(`off-script Black move made: ${result.san}`);
            // console.log(`fen in logic.makemoveblack after off-script move:  ${this.chess.fen()}`);
            // console.log(`black moves: ${bestMove.move.san}`);
            // console.log(`new fen in makeblackmove: ${this.chess.fen()}`);            
            return {
                move: bestMove.move,
                boardState: this.getBoardState(),
                status: this.getGameStatus(),
            };
        }
    }
    indexToAlgebraic(index) {
        const file = index & 7;
        const rank = (index >> 4) + 1;
        if (file < 0 || file > 7 || rank < 1 || rank > 8) {
            console.log(`Invalid index for algebraic conversion: ${index}`);
            return null;
        }
        return 'abcdefgh'[file] + rank;
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
        this.engine.setFEN(this.chess.fen());
        // console.log(`fen in logic.makeprincipalmove after  move: ${this.chess.fen()}`);

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
        this.engine.setFEN(this.chess.fen());
        // Step 1: Get top 3 moves for White
        const topWhiteMoves = [
            this.engine.searchPosition(4)[0],
            this.engine.searchPosition(3)[0],
            this.engine.searchPosition(2)[0]
        ];
        // console.log(`white move 1: ${JSON.stringify(topWhiteMoves[0],null,2)}`);
        // console.log(`white move 2: ${JSON.stringify(topWhiteMoves[1],null,2)}`);
        // console.log(`white move 3: ${JSON.stringify(topWhiteMoves[2],null,2)}`);
        // Step 2: For each move, get likely Black responses
        const tableData = topWhiteMoves.map((whiteMove) => {
            //  console.log(`fen in logic.gettabledata before temp move:        ${this.chess.fen()}`);
            const fromAlgebraic = this.indexToAlgebraic(whiteMove.move.from);
            const toAlgebraic = this.indexToAlgebraic(whiteMove.move.to);
            const moveResult = this.chess.move({ from: fromAlgebraic, to: toAlgebraic });
            //  console.log(`fen in logic.gettabledata after temp move:        ${this.chess.fen()}`);
            
            const fenafterwhite = this.chess.fen()
            this.engine.setFEN(fenafterwhite);
            // console.log('temp white');
            // this.engine.printBoard();
            // console.log(this.chess.ascii());

            if (!moveResult) {
               console.warn(`Failed to make temporary White move: `);
              return null;
            }
            const sanMove = moveResult.san;
            const likelyResponses = [
                this.engine.searchPosition(3)[0],
                this.engine.searchPosition(2)[0]
            ];
            // console.log(`likelyResponses:`);
            const processedResponses = likelyResponses.map((response) => {
                const responseFrom = this.indexToAlgebraic(response.move.from);
                const responseTo = this.indexToAlgebraic(response.move.to);
                // Get SAN notation for the response
                const responseResult = this.chess.move({ from: responseFrom, to: responseTo });
                const responseSan = responseResult ? responseResult.san : '';
                this.chess.undo();  //undo black response
                this.engine.setFEN(fenafterwhite);
                // console.log(`from ${responseFrom}`);
                // console.log(`to ${responseTo}`);
                return {
                    san: responseSan,
                    move:response.move,
                };
            });
            //this.chess.undo();  //undo white advice
            this.chess.load(originalFEN); // Restore FEN
            this.engine.setFEN(originalFEN);
            //  console.log(`move: ${whiteMove.move.san}`);
            return {
                san: sanMove,
                move: whiteMove.move,
                reasoning: this.attachAttributes(whiteMove),
                likelyResponses: processedResponses
            };
        });
        return tableData.filter(row => row !== null);;
    }
    
    attachAttributes(moveInfo) {
        const reasoning = [];
        if (moveInfo.move.captured) {
            reasoning.push(`Captures opponent's ${this.engine.getPieceName(moveInfo.move.captured)}`);
        }
        // if (this.engine.CENTER_SQUARES.includes(moveInfo.move.to)) {
        //     reasoning.push('Controls a central square');
        // }
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