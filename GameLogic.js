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
        console.log("Move was successful:", move);
        return move; // Return the move object if successful
      } else {
        console.log("Invalid move attempted:", fromSquare, "to", toSquare);
        return null; // Return null if the move was invalid
      }
    } catch (error) {
      console.log("Invalid move caught from chess.js:", error.message);
      return null; // Return null if chess.js throws an error
    }
  }
  

  async makeAIMove() {
    const possibleMoves = this.chess.moves();
    if (possibleMoves.length === 0) {
      return null;
    }
  
    const bestMove = this.chess.move(possibleMoves[0]);
    const fromSquare = bestMove.from;
    const toSquare = bestMove.to;
  
    const explanationPrompt = `Give me a concise reasoning behind the move from ${fromSquare} to ${toSquare} in chess.`;
  
    try {
      console.log("Explanation Prompt: ", explanationPrompt);
  
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
      console.log("Gemini API response:", JSON.stringify(data, null, 2)); // Log full data in readable format
  
      // Extract the content from the response
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        let explanation = data.candidates[0].content.parts[0].text; // Adjust this depending on the exact content structure
        explanation = explanation.length > 100 ? explanation.substring(0, 100) + '...' : explanation;

        console.log("Explanation:", explanation);
  
        return {
          move: bestMove,
          boardState: this.getBoardState(),
          status: this.getGameStatus(),
          explanation: explanation,
        };
      } else {
        return {
          move: bestMove,
          boardState: this.getBoardState(),
          status: this.getGameStatus(),
          explanation: 'No explanation provided',
        };
      }
    } catch (error) {
      console.error("Error fetching explanation from Gemini:", error);
      return null;
    }
  }
  


  selectBestMove(possibleMoves) {
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }
}

export default GameLogic;