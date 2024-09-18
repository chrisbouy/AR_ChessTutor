
import { Chess } from 'chess.js';
class GameLogic {
  constructor() {
    this.chess = new Chess();
    this.tutorLevel = 5; // Default tutor level
  }
  fenToBoardLayout(fen) {
    const fenParts = fen.split(' ');
    const fenBoard = fenParts[0];
    const rows = fenBoard.split('/');
    const pieceMap = {
      'r': 'Black Rook',
      'n': 'Black Knight',
      'b': 'Black Bishop',
      'q': 'Black Queen',
      'k': 'Black King',
      'p': 'Black Pawn',
      'R': 'White Rook',
      'N': 'White Knight',
      'B': 'White Bishop',
      'Q': 'White Queen',
      'K': 'White King',
      'P': 'White Pawn'
    };
    let boardLayout = '';
    rows.forEach((row, rowIndex) => {
      let boardRow = `Rank ${8 - rowIndex}: `;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (!isNaN(char)) {
          boardRow += `${char} empty squares, `;
        } else {
          const pieceDescription = pieceMap[char];
          const file = String.fromCharCode(97 + boardRow.replace(/[^,]/g, '').length); // a-h files
          boardRow += `${pieceDescription} at ${file}${8 - rowIndex}, `;
        }
      }
      boardLayout += boardRow.trimEnd().slice(0, -1) + '.\n';
    });
    return boardLayout.trim();
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
        // console.log("Move was successful:", move);
        return move;
      } else {
        // console.log("Invalid move attempted:", fromSquare, "to", toSquare);
        return null;
      }
    } catch (error) {
      // console.log("Invalid move caught from chess.js:", error.message);
      return null;
    }
  }
  async getAdvicePrompt() {
    const turn = 'White';
    const phase = this.getGamePhase();
    const fen_after_black = this.chess.fen();
    const boardLayout = this.fenToBoardLayout(fen_after_black);
    const moveHistory = this.chess.history({ verbose: true });
    const lastMove = moveHistory[moveHistory.length - 1];
    // Format moves for prompt
    const moveList = moveHistory.map((move, index) => {
        const moveNumber = Math.floor(index / 2) + 1;
        const moveString = `${move.color === 'w' ? moveNumber + '.' : ''} ${move.san}`;
        return moveString;
    }).join(' ');
   const advicePrompt = `{
   "input": {
    "board_state": "${this.chess.fen()}",
    "move_list": "${moveList}",
    "game_phase": "${this.getGamePhase()}",
    "last_move": "${lastMove.piece} from ${lastMove.from} to ${lastMove.to}"
  },
   "output": {
        "full_advice": "Analyze the current board state strictly from the FEN model (${this.chess.fen()})
        focusing on the strategic goals of both sides
        Provide a 400-character breakdown of each player's main objectives"
        "summary_advice": "Then based on the current phase (${phase}) recommend White's best move
        Provide a brief 230-character explanation for the move"
    }
  }`
  // console.log(advicePrompt)
    return advicePrompt;
  }
  async getExplanationPrompt() {
    const turn = 'White';
    const phase = this.getGamePhase();
    const fen_after_black = this.chess.fen();
    const boardLayout = this.fenToBoardLayout(fen_after_black);
    const moveHistory = this.chess.history({ verbose: true });
  const lastMove = moveHistory[moveHistory.length - 1];
  
  // Format moves for prompt
  const moveList = moveHistory.map((move, index) => {
  const moveNumber = Math.floor(index / 2) + 1;
  const moveString = `${move.color === 'w' ? moveNumber + '.' : ''} ${move.san}`;
  return moveString;
  }).join(' ');
  
  // Add move list and last move details to the prompt
  //`You are tutoring chess at level ${this.tutorLevel} on a scale of 1 to 10.
    // Output the current ${boardLayout} and describe the current board state and position evaluation, 
  // listing exactly where everything on the board is and taking into account move_list'
  const explanationPrompt = `{
  "input": 
        "board_state": "a representation of this FEN model: ${this.chess.fen()}"
        "move_list": ${moveList}
        "turn": ${this.chess.turn() === 'w' ? 'White' : 'Black'}"'s turn. "
        "game_phase": ${this.getGamePhase()}
        "last_move":"${lastMove.piece} from ${lastMove.from} to ${lastMove.to}"
  "output":
        "board": "the current FEN."
        "full_analysis": "400 character analysis of black's last move."
        "summary_analysis": "230 characters summary of analysis of black's last move remove all symbols from output"
        }`;
    return explanationPrompt;
  }

  async getBestMoveFromLichess(fen) {
    try {
      const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${fen}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer lip_iioABYocYPTzLDGEnMrt`, // Replace with your Lichess API token
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch best move from Lichess");
      }
      const data = await response.json();
      return data.pvs[0].moves.split(" ")[0]; // Return the best move from Lichess
    } catch (error) {
      // console.error("Error fetching best move from Lichess:", error);
      return null;
    }
  }
  async makeAIMove() {
    try {
      const fen_after_white = this.chess.fen();
      const bestMove = await this.getBestMoveFromLichess(fen_after_white); // Get best move from Lichess
      
      if (!bestMove) {
        console.log("No valid move retrieved from Lichess.");
        return null;
      }
  
      const move = this.chess.move(bestMove); // Apply the move in chess.js
      if (!move) {
        console.log("Invalid AI move:", bestMove);
        return null;
      }
  
      const explanationPrompt = await this.getExplanationPrompt(); // Create an explanation prompt for Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyAVXJy-l0HMXogxddTCoE7pB7Q1EBPJObE`, {
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
      // console.log("Gemini API response for AI analysis:", JSON.stringify(data, null, 2));
  
      let summary = 'No summary provided.';
      
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        let responseText = data.candidates[0].content.parts[0].text;
        console.log("Response Text from Gemini API:", responseText);
        
        // Remove code block markers and newlines
        responseText = responseText.replace(/```json|```/g, '').trim();
  
        try {
          // Parse the cleaned JSON string
          const parsedResponse = JSON.parse(responseText);
          // console.log("Parsed Response:", parsedResponse);
          
          // Extract summary analysis if available
          if (parsedResponse.output.summary_analysis) {
            summary = parsedResponse.output.summary_analysis;
          } else {
            console.error("Summary analysis not found in parsed response.");
          }
        } catch (error) {
          console.error("Error parsing responseText as JSON:", error);
        }
      }
  
      // Return the move, updated board state, and explanation to be handled by App.js
      return {
        move: move, // AI move
        boardState: this.getBoardState(), // Updated board state
        status: this.getGameStatus(), // Current game status
        explanation: summary, // Explanation from Gemini
      };
    } catch (error) {
      console.error("Error during AI move:", error);
      return null;
    }
  }
  
  
  async getPlayerMoveAdvice() {
    const advicePrompt = await this.getAdvicePrompt();
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyAVXJy-l0HMXogxddTCoE7pB7Q1EBPJObE`, {
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
      // console.log("Gemini API response for player advice:", JSON.stringify(data, null, 2));
  
      let summary = 'No summary provided.';
      
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        const responseText = data.candidates[0].content.parts[0].text;
        // console.log("Advice from Gemini API:", responseText);
  
        try {
          // Parse the responseText if it's in JSON format
          const parsedResponse = JSON.parse(responseText.replace(/```json|```/g, '').trim());
          console.log(`Parsed Response: ${JSON.stringify(parsedResponse, null, 2)}`);
          // Extract summary advice if available
          if (parsedResponse.output.summary_advice) {
            summary = parsedResponse.output.summary_advice;
            console.log(summary);
          } else {
            console.error("Summary advice not found in parsed response.");
          }
        } catch (error) {
          console.error("Error parsing responseText as JSON:", error);
        }
      }
  
      return summary; // Return the summary advice to display in the app
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
