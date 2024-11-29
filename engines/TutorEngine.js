import { Chess } from 'chess.js';

class TutorEngine {
    constructor() {
        this.chess = new Chess();
        this.pieceValues = {
            p: 100,
            n: 300,
            b: 320,
            r: 500,
            q: 900,
            k: 20000
        };
    }

    setPosition(fen) {
        this.chess.load(fen);
    }

    evaluatePosition() {
        const board = this.chess.board();
        let score = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (!piece) continue;

                // Base piece value
                const value = this.pieceValues[piece.type];
                score += piece.color === 'w' ? value : -value;

                // Penalize early queen moves
                if (piece.type === 'q' && this.chess.moveNumber() < 5) {
                    score += piece.color === 'w' ? -30 : 30;
                }

                // Penalize moving pawns too far forward early
                if (piece.type === 'p' && this.chess.moveNumber() < 5) {
                    const rank = piece.color === 'w' ? row : 7 - row;
                    if (rank > 4) {
                        score += piece.color === 'w' ? -20 : 20;
                    }
                }

                // Penalize moving knights to the rim
                if (piece.type === 'n' && (col === 0 || col === 7)) {
                    score += piece.color === 'w' ? -30 : 30;
                }
            }
        }

        return score;
    }

    getBestMove(depth = 2) {
        const moves = this.chess.moves({ verbose: true });
        if (!moves.length) return null;

        const scoredMoves = moves.map(move => {
            this.chess.move(move);
            const score = this.evaluateMove(move);
            this.chess.undo();
            return { move, score };
        });

        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves[0];
    }

    evaluateMove(move) {
        let score = 0;

        // Capturing pieces is good
        if (move.captured) {
            score += this.pieceValues[move.captured];
        }

        // Control center
        if (['d4', 'd5', 'e4', 'e5'].includes(move.to)) {
            score += 30;
        }

        // Develop pieces early
        if (this.chess.moveNumber() < 10) {
            if (['n', 'b'].includes(move.piece)) {
                score += 20;
            }
        }

        // Castling is good
        if (move.flags.includes('k') || move.flags.includes('q')) {
            score += 40;
        }

        // Avoid moving the same piece twice in opening
        if (this.chess.moveNumber() < 6 && this.chess.history().some(m => m.startsWith(move.piece + move.from))) {
            score -= 30;
        }

        // Penalize moving to rim
        if (move.to.includes('a') || move.to.includes('h')) {
            score -= 10;
        }

        return score;
    }

    getAdvice() {
        const moves = this.chess.moves({ verbose: true });
        if (!moves.length) return [];

        const evaluatedMoves = moves.map(move => {
            const score = this.evaluateMove(move);
            return {
                move,
                score,
                reasoning: this.getMoveReasoning(move, score)
            };
        });

        return evaluatedMoves
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    }

    getMoveReasoning(move, score) {
        const reasons = [];

        if (move.captured) {
            reasons.push(`Captures ${this.getPieceName(move.captured)}`);
        }

        if (['d4', 'd5', 'e4', 'e5'].includes(move.to)) {
            reasons.push('Controls center');
        }

        if (this.chess.moveNumber() < 10 && ['n', 'b'].includes(move.piece)) {
            reasons.push('Develops piece');
        }

        if (move.flags.includes('k') || move.flags.includes('q')) {
            reasons.push('Castling for king safety');
        }

        // Always provide at least one reason
        if (reasons.length === 0) {
            if (score > 50) {
                reasons.push('Improves position');
            } else {
                reasons.push('Maintains position');
            }
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

export default TutorEngine;