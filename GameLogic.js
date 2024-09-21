import { Chess } from 'chess.js';

class GameLogic {
  constructor() {
    this.chess = new Chess();
    this.tutorLevel = 5; // Default tutor level
  }
  getGameStatus() {
    return this.chess.isCheckmate() ? 'checkmate' : this.chess.isDraw() ? 'draw' : 'ongoing';
  }
  fenToBoardLayout(fen) {
    const fenParts = fen.split(' ');
    const fenBoard = fenParts[0];
    const rows = fenBoard.split('/');
    const pieceMap = {
      'r': 'Black Rook', 'n': 'Black Knight', 'b': 'Black Bishop',
      'q': 'Black Queen', 'k': 'Black King', 'p': 'Black Pawn',
      'R': 'White Rook', 'N': 'White Knight', 'B': 'White Bishop',
      'Q': 'White Queen', 'K': 'White King', 'P': 'White Pawn'
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
          const file = String.fromCharCode(97 + boardRow.replace(/[^,]/g, '').length);
          boardRow += `${pieceDescription} at ${file}${8 - rowIndex}, `;
        }
      }
      boardLayout += boardRow.trimEnd().slice(0, -1) + '.\n';
    });
    return boardLayout.trim();
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
        return move;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  async getBestMoveFromLichess(fen) {
    try {
      const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${fen}`, {
        method: 'GET',
        headers: {
           'Authorization': `Bearer lip_iioABYocYPTzLDGEnMrt`
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
  
  async makeCombinedCall() {
    try {
      // Generate the FEN AFTER Black's move is made
      const fen = this.chess.fen();
      const bestMove = await this.getBestMoveFromLichess(fen); // Now Lichess will return White's best move
      console.log(`Best Move from Lichess: ${bestMove}`);
      
      // Get the board layout and move history after Black's move is made
      const boardLayout = this.fenToBoardLayout(fen);
      const moveHistory = this.chess.history({ verbose: true });
      const lastMove = moveHistory[moveHistory.length - 1]; // This should now include Black's last move
      
      // Build the move list, including both White and Black's moves
      const moveList = moveHistory.map((move, index) => {
        const moveNumber = Math.floor(index / 2) + 1;
        const moveString = `${move.color === 'w' ? moveNumber + '.' : ''} ${move.san}`;
        return moveString;
      }).join(' ');
      
      // Generate the prompt AFTER Black's move, ensuring the best move for White is returned
      const prompt = `
        The best move for White is ${bestMove}.
        The current FEN is ${fen}.
        The board layout is as follows: ${boardLayout}.
        The move list is: ${moveList}.
        Provide the best move analysis and strategic advice for both Black and White in the following structured format:

{
  "bestMoveExplanation": "<Provide explanation for the best move>",
  "strategicAnalysisForBlack": "<Provide a 200 character strategic analysis for Black's last move>",
  "strategicAdviceForWhite": "<Provide a 200 character strategic advice for White's next move>",
  "overallConclusion": "<Provide the overall conclusion for the current board state>"
}
      `;
      
      console.log('Generated Prompt for Gemini:', prompt);
      
      // Call Gemini API with the prompt after Black's move is processed
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyAVXJy-l0HMXogxddTCoE7pB7Q1EBPJObE`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "contents": [
            {
              "role": "user",
              "parts": [{ "text": prompt }]
            }
          ]
        }),
      });
      
      const data = await response.json();
      console.log('Raw Gemini API response:', JSON.stringify(data, null, 2)); // Log raw response
      
      let summary = 'No summary provided.';
      let fullAdvice = 'No full advice provided.';
      
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        const responseText = data.candidates[0].content.parts[0].text;
        console.log("Response Text from Gemini API:", responseText);
        fullAdvice = extractSectionsFromAdvice(responseText);
      }
      
      return { 
        move: lastMove, // AI move
        boardState: this.getBoardState(), // Updated board state
        status: this.getGameStatus(), // Current game status
        adviceSummary: fullAdvice.strategicAdviceForWhite, // Explanation from Gemini
        analysisSummary: fullAdvice.strategicAnalysisForBlack
      };
    } catch (error) {
      console.error("Error during combined call:", error);
      return null;
    }
}

  
}
function extractSectionsFromAdvice(adviceText) {


    const strategicAnalysisForBlack = adviceText
    .split('strategicAnalysisForBlack')[1]
    .split('strategicAdviceForWhite')[0]
    .trim();

  // Extract the section for White's strategic advice
  const strategicAdviceForWhite = adviceText
    .split('strategicAdviceForWhite')[1]
    .split('overallConclusion')[0]
    .trim();

  return {
    strategicAnalysisForBlack,
    strategicAdviceForWhite,
  };
}
export default GameLogic;
