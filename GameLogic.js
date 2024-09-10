import { Chess } from 'chess.js';

class GameLogic {
  constructor() {
    this.chess = new Chess();
    this.tutorLevel = 5; // Default tutor level
  }

  getGameStatus() {
    return this.chess.isCheckmate() ? 'checkmate' : this.chess.isDraw() ? 'draw' : 'ongoing';
  }

  getBoardState() {
    const board = this.chess.board();
    return board.map((row) =>
      row.map((piece) =>
        piece ? { type: piece.type, color: piece.color } : null
      )
    );
  }

  makeMove(fromSquare, toSquare) {
    try {
      const move = this.chess.move({ from: fromSquare, to: toSquare });
      if (move) {
        console.log("Move was successful:", move);
        return move;
      } else {
        console.log("Invalid move attempted:", fromSquare, "to", toSquare);
        return null;
      }
    } catch (error) {
      console.log("Invalid move caught from chess.js:", error.message);
      return null;
    }
  }

async getAdvicePrompt(fen) {
  const phase = this.getGamePhase();  // Game phase (opening, midgame, endgame)
  const lastMove = this.chess.history({ verbose: true }).pop();  // Last move in the game
  
  const advicePrompt = `You are tutoring chess at level ${this.tutorLevel} on a scale of 1 to 10. 
  Current board state (FEN): ${fen}
  Game phase: ${phase}
  Last move: Black moved ${lastMove.piece} from ${lastMove.from} to ${lastMove.to}

  1. Describe the current board state and position evaluation listing exactly where everything on the board is.
  2. Provide the best possible move for White, considering legal and logical moves only.
  3. Explain which pieces are involved in your suggested move and how it affects the game.`;

  return advicePrompt;
}


  async getExplanationPrompt(fen, move) {
    const turn = this.chess.turn() === 'w' ? 'White' : 'Black';
    const phase = this.getGamePhase();
    const lastMove = this.chess.history({ verbose: true }).pop();

    const explanationPrompt = `You are a chess tutor at level ${this.tutorLevel} (1-10 scale). 
  Current board state (FEN): ${fen}
  Current turn: ${turn}
  Game phase: ${phase}
  Last move: ${lastMove ? `${lastMove.color === 'w' ? 'White' : 'Black'} moved ${lastMove.piece} from ${lastMove.from} to ${lastMove.to}` : 'No moves yet'}

  1. tell me where everything on the board is. In plain English and FEN notation
  1. Describe the current board state and position evaluation listing exactly where everything on the board is.
  2. Provide analysis of ${turn}'s most recent move.
  3. Explain which pieces are involved in ${turn}'s move from ${move.from} to ${move.to} and how it affects the game.`;

    return explanationPrompt;
  }

  async getBestMoveFromLichess(fen) {
    try {
      const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${fen}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer lip_tsmoaNvQ0k4kbrmhMQLb`, // Replace with your Lichess API token
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch best move from Lichess");
      }

      const data = await response.json();
      return data.pvs[0].moves.split(" ")[0]; // Return the best move from Lichess
    } catch (error) {
      console.error("Error fetching best move from Lichess:", error);
      return null;
    }
  }

  async makeAIMove() {
    try {
      const fen = this.chess.fen();
      console.log("Current FEN before AI move:", fen);

      const bestMove = await this.getBestMoveFromLichess(fen); // Get best move from Lichess
      if (!bestMove) {
        console.log("No valid move retrieved from Lichess.");
        return null;
      }

      console.log("Best move retrieved from Lichess:", bestMove);

      // Apply the move in chess.js
      const move = this.chess.move(bestMove);
      if (!move) {
        console.log("Invalid AI move:", bestMove); // If move is invalid, return
        return null;
      }

      console.log("Move applied on the board:", move);

      // Create an explanation prompt for Gemini
      const explanationPrompt = await this.getExplanationPrompt(fen, { from: move.from, to: move.to });

      console.log("Explanation Prompt:", explanationPrompt);

      // Call Gemini API for explanation
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "contents": [
            {
              "role": "user",
              "parts": [{ "text": explanationPrompt }]
            }
          ]
        }),
      });

      const data = await response.json();
      console.log("Gemini API response for AI analysis:", JSON.stringify(data, null, 2));

      let explanation = 'No explanation provided';
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        explanation = data.candidates[0].content.parts[0].text;
      }

      // Return the move, updated board state, and explanation to be handled by App.js
      return {
        move: move, // AI move
        boardState: this.getBoardState(), // Updated board state
        status: this.getGameStatus(), // Current game status
        explanation: explanation, // Explanation from Gemini
      };

    } catch (error) {
      console.error("Error during AI move:", error);
      return null;
    }
  }

  async getPlayerMoveAdvice() {
    const fen = this.chess.fen();
    const advicePrompt = await this.getAdvicePrompt(fen);

    try {
      console.log("Advice Prompt: ", advicePrompt);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "contents": [
            {
              "role": "user",
              "parts": [{ "text": advicePrompt }]
            }
          ]
        }),
      });

      const data = await response.json();
      console.log("Gemini API response for player advice:", JSON.stringify(data, null, 2));

      // Extract the advice content from the response
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        let advice = data.candidates[0].content.parts[0].text;
        return advice;
      } else {
        return 'No advice provided.';
      }

    } catch (error) {
      console.error("Error fetching advice from Gemini:", error);
      return 'Error fetching advice.';
    }
  }

  formatBoardForPrompt(boardState) {
    return boardState.map(row => row.map(piece => piece ? `${piece.color}${piece.type}` : '-').join(' ')).join('\n');
  }

  getGamePhase() {
    const moveCount = this.chess.history().length;
    if (moveCount <= 10) return 'Opening';
    if (moveCount <= 30) return 'Midgame';
    return 'Endgame';
  }
}

export default GameLogic;
