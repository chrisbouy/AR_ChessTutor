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
        return move;
      } else {
        return null;
      }
    } catch (error) {
      console.log("Invalid move caught from chess.js:", error.message);
      return null;
    }
  }

  async getBestMoveFromLichess(fen) {
    try {
      const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${fen}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer lip_EXDEZ8nlr9s760AwWIlM`,  // Use your Lichess API token
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
    const fen = this.chess.fen();
    const bestMove = await this.getBestMoveFromLichess(fen);
    
    if (!bestMove) {
      console.log("No move found from Lichess.");
      return null;
    }

    this.chess.move(bestMove);
    const aiMove = this.chess.history().slice(-1)[0];  // Get the last move made
    
    const explanation = await this.analyzeAIMoveWithGemini(aiMove);

    return {
      move: aiMove,
      boardState: this.getBoardState(),
      status: this.getGameStatus(),
      explanation: explanation,
    };
  }

  async analyzeAIMoveWithGemini(move) {
    const explanationPrompt = `Give me a concise reasoning behind the move ${move} in chess.`;
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "contents": [
            {
              "role": "user",
              "parts": [{"text": explanationPrompt}]
            }
          ]
        }),
      });

      const data = await response.json();
      
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        let explanation = data.candidates[0].content.parts[0].text;
        return explanation.length > 100 ? explanation.substring(0, 100) + '...' : explanation;
      } else {
        return 'No explanation provided';
      }
    } catch (error) {
      console.error("Error fetching explanation from Gemini:", error);
      return 'No explanation provided';
    }
  }

  async getPlayerMoveAdvice() {
    const advicePrompt = `What should be the player's next best move in this position?`;
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "contents": [
            {
              "role": "user",
              "parts": [{"text": advicePrompt}]
            }
          ]
        }),
      });

      const data = await response.json();
      
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        return 'No advice provided';
      }
    } catch (error) {
      console.error("Error fetching advice from Gemini:", error);
      return 'No advice provided';
    }
  }
}

export default GameLogic;
