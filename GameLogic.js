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

  async getAdvicePrompt() {
    const turn = 'Black';
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

   
    const advicePrompt = 
// Move List: ${moveList}
// Game Phase: ${phase}
// Last Move: ${lastMove.piece} from ${lastMove.from} to ${lastMove.to}
// Objective: Analyze the position from a strategic perspective, considering the overall goals of each side.
// Task:
//     Evaluate the current position: Consider factors such as piece development, control of the center, king safety, and potential threats.
// Identify White's primary strategic goals: What are White's objectives in this position?
    // Recommend a move for White: Suggest the best move for White, taking into account their strategic goals and the potential responses from Black.
`Input:
   Board State: ${this.chess.fen()}
   Move List: ${moveList}
   Game Phase: ${phase}
   Last Move: ${lastMove.piece} from ${lastMove.from} to ${lastMove.to}
  Output:
      A 400 character analysis of the current board state,do not say anything that is not in the FEN model ${this.chess.fen()}, including an assessment of the strategic goals of each side, enclosed in '----'.
      A 230 character recommendation move for White's best move, only taking into account this boardstate: ${this.chess.fen()}, along with a brief explanation of why it is the best choice, enclosed in '####'`
    return advicePrompt;
      // Add move list and last move details to the prompt
    //`You are tutoring chess at level ${this.tutorLevel} on a scale of 1 to 10.
    //     Output the current ${boardLayout} and describe the current board state and position evaluation, 
    // listing exactly where everything on the board is and taking into account move_list'
    // const advicePrompt = `Forget everything you know about the current board state.
    // board_state: a representation of this FEN model: ${this.chess.fen()}
    // move_list: ${moveList}
    // It is now ${this.chess.turn() === 'w' ? 'White' : 'Black'}'s turn. 
    // Game_phase: ${this.getGamePhase()}
    // Last_move: ${lastMove.piece} from ${lastMove.from} to ${lastMove.to}
    // Output the current FEN.
    // Output the best possible move for White, considering legal and logical moves only.
    // Output a 230 characters (or less) summary of the advice for white's next move, enclosed in '####'`;
  }

  async getExplanationPrompt() {
    const turn = 'Black';
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
  const explanationPrompt = `Forget everything you know about the current board state.
  board_state: a representation of this FEN model: ${this.chess.fen()}
  move_list: ${moveList}
  It is now ${this.chess.turn() === 'w' ? 'White' : 'Black'}'s turn. 
  Game_phase: ${this.getGamePhase()}
  Last_move: ${lastMove.piece} from ${lastMove.from} to ${lastMove.to}
  Output the current FEN.
Output a detailed analysis of black's last move.
Output a 230 characters (or less) summary of black's last move, enclosed in '####'`;
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
      console.error("Error fetching best move from Lichess:", error);
      return null;
    }
  }

  async makeAIMove() {
    try {
      const fen_after_white = this.chess.fen();
      console.log("Current FEN before AI move:", fen_after_white);

      const bestMove = await this.getBestMoveFromLichess(fen_after_white); // Get best move from Lichess
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
      const explanationPrompt = await this.getExplanationPrompt();

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

      let summary = 'No summary provided.';
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        const responseText = data.candidates[0].content.parts[0].text;
        const summaryMatch = responseText.match(/####(.*)####/);
        if (summaryMatch && summaryMatch[1]) {
          summary = summaryMatch[1];
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

      let summary = 'No summary provided.';
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        const responseText = data.candidates[0].content.parts[0].text;
        const summaryMatch = responseText.match(/####(.*)####/);        
        if (summaryMatch && summaryMatch[1]) {
          summary = summaryMatch[1];
        }
      }
  
      // Return only the summary to display in the app
      return summary;
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