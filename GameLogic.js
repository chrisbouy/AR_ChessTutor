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
  // Method for making moves (for both player and AI)
  makeMove(fromSquare, toSquare) {
    try {
      const move = this.chess.move({ from: fromSquare, to: toSquare });
      if (move) {
        return move;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error making move:', error);
      return null;
    }
  }
  // AI (Black) makes a move using the best move fetched from Lichess
  async makeComputerMove() {
    const fen = this.chess.fen(); // FEN after White's move
    const bestMoveForBlack = await this.getBestMoveFromLichess(fen);

    if (!bestMoveForBlack) {
      console.error("Failed to get Black's move from Lichess");
      return null;
    }

    // AI (Black) makes its move
    const blackMove = this.makeMove(bestMoveForBlack.slice(0, 2), bestMoveForBlack.slice(2, 4));
    if (!blackMove) {
      console.error("Invalid move by AI (Black)");
      return null;
    }

    return blackMove; // Return the move made by the AI
  }
  // Get the best move for the AI (Black) from Lichess
  async getBestMoveFromLichess(fen) {
    try {
      const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${fen}`, {
        method: 'GET',
        headers: {
           'Authorization': `Bearer lip_iioABXxxYPTzLDGEnMrt`
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
  // The main function that handles the player move and AI response
  async makePlayerMoveAndGenerateAIResponse(fromSquare, toSquare) {
    // Player (White) makes a move
    const playerMove = this.makeMove(fromSquare, toSquare);

    if (!playerMove) {
      return { error: "Invalid move by the player" };
    }

    // After player makes a valid move, AI (Black) makes its move
    const blackMove = await this.makeComputerMove();

    if (!blackMove) {
      return { error: "Failed to make AI (Black) move" };
    }

    // Call Gemini for analysis of Black's move and advice for White
    const combinedAnalysis = await this.makeCombinedCall();

    if (!combinedAnalysis) {
      return { error: "Failed to get analysis from Gemini" };
    }

    return {
      boardState: this.getBoardState(), // Updated board state
      playerMove,
      blackMove,
      adviceSummary: combinedAnalysis.adviceSummary,
      analysisSummary: combinedAnalysis.analysisSummary
    };
  }
  async makeCombinedCall() {
    const fen = this.chess.fen();
    const moveHistory = this.chess.history({ verbose: true });
    const lastMove = moveHistory[moveHistory.length - 1]; // This should now include Black's last move
    const moveList = moveHistory.map((move, index) => {
      const moveNumber = Math.floor(index / 2) + 1;
      return `${move.color === 'w' ? moveNumber + '.' : ''} ${move.san}`;
    }).join(' ');
  
    const prompt = `
      The last move for Black was ${lastMove.san}.
      The current FEN is ${fen}.
      The move list is: ${moveList}.
      Provide the best move analysis and strategic advice for both Black and White in the following structured format:
  
      {
        "strategicAnalysisForBlack": "<Provide a 200 character long strategic analysis for Black's last move>",
        "strategicAdviceForWhite": "<Provide a 200 character long strategic advice for White's next move>"
      }
    `;
  
    try {
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
  
      // Use response.json() to get a parsed object
      const jsonResponse = await response.json();
  
      // Access the relevant text within the candidates array
      const responseText = jsonResponse.candidates[0].content.parts[0].text;
  
      // Extract advice and analysis from the response text
      const { strategicAnalysisForBlack, strategicAdviceForWhite } = extractSectionsFromAdvice(responseText);
  
      return {
        adviceSummary: strategicAdviceForWhite,
        analysisSummary: strategicAnalysisForBlack,
      };
  
    } catch (error) {
      console.error("Error fetching analysis from Gemini:", error);
      return null;
    }
  }
  
}

function extractSectionsFromAdvice(adviceText) {
  // console.log(adviceText);
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
