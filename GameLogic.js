import { Chess } from 'chess.js';

class GameLogic {
  constructor() {
    this.chess = new Chess();
    this.tutorLevel = 5;  // Default tutor level
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

  async getAdvicePrompt(boardState) {
    const boardString = this.formatBoardForPrompt(boardState);

    const advicePrompt = `You are tutoring chess at level ${this.tutorLevel} on a scale of 1 to 10. 
  Here is the current board state: 
  ${boardString}
  Please provide the best possible move for the player, considering legal and logical moves only.
  Concisely explain which pieces are involved and how it affects the game. Do not include special characters or line breaks in the response`;

    
    return advicePrompt;
  }

  async getExplanationPrompt(boardState, move) {
    const boardString = this.formatBoardForPrompt(boardState);
    
    const explanationPrompt = `You are a chess tutor at level ${this.tutorLevel} (1-10 scale). Do not include special characters or line breaks in the response. 
    Given the current board state:
    ${boardString}
    Concisely explain the reasoning behind the AI's move from ${move.from} to ${move.to}.`;

    return explanationPrompt;
  }

  async getBestMoveFromLichess(fen) {
    try {
      const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${fen}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer lip_EXDEZ8nlr9s760AwWIlM`,  // Replace with your Lichess API token
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
      const fen = this.chess.fen(); // Get the current FEN notation
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
      const explanationPrompt = await this.getExplanationPrompt(this.getBoardState(), { from: move.from, to: move.to });
  
      console.log("Explanation Prompt:", explanationPrompt);
  
      // Call Gemini API for explanation
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
  
      let explanation = 'No explanation provided';
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        explanation = data.candidates[0].content.parts[0].text;
        explanation = explanation.length > 100 ? explanation.substring(0, 100) + '...' : explanation;
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
    const boardState = this.getBoardState();
    const advicePrompt = await this.getAdvicePrompt(boardState);

    try {
      console.log("Advice Prompt: ", advicePrompt);

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
      console.log("Gemini API response for player advice:", JSON.stringify(data, null, 2));

      // Extract the advice content from the response
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        let advice = data.candidates[0].content.parts[0].text;
        advice = advice.length > 100 ? advice.substring(0, 100) + '...' : advice;

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
}

export default GameLogic;
