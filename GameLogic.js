import { Chess } from 'chess.js';

class GameLogic {
  constructor() {
    this.chess = new Chess();
  }
  getGameStatus() {
    if (this.chess.isCheckmate()) {
      return 'checkmate';
    } else if (this.chess.isDraw()) {
      return 'draw';
    } else {
      return 'ongoing';
    }
  }
  getBoardState() {
    const board = this.chess.board();
    return board.map((row) =>
      row.map((piece) => (piece ? { type: piece.type, color: piece.color } : null))
    );
  }
  makeMove(move) {
    try {
      const result = this.chess.move(move);
      if (result) {
        return result;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error making move:', error);
      return null;
    }
  }
  async getBestMoveFromLichess(fen) {
    try {
      const response = await fetch(
        `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer lip_iioABYocYPTzLDGEnMrt`, // Replace with your Lichess API token
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch best move from Lichess');
      }
      const data = await response.json();
      console.log('Lichess API Response:', data);

      if (data.pvs && data.pvs.length > 0 && data.pvs[0].moves) {
        let bestMoveUCI = data.pvs[0].moves.split(' ')[0];
  
        // Convert castling moves to SAN
        const bestMoveSAN = convertCastlingUCItoSAN(bestMoveUCI);
        if (bestMoveSAN) {
          return { uci: bestMoveUCI, san: bestMoveSAN };
        } else {
          // Convert other moves using chess.js
          const chessCopy = new Chess(fen);
          const moveResult = chessCopy.move(bestMoveUCI);
          if (moveResult) {
            return { uci: bestMoveUCI, san: moveResult.san };
          } else {
            console.error('Invalid best move from Lichess');
            return null;
          }
        }
      } else {
        console.error('No moves found in Lichess API response.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching best move from Lichess:', error);
      return null;
    }
  }
  // Get last move in SAN, handling castling
  async getAdviceFromAI(bestMoveForWhiteUCI) {
      const fen = this.chess.fen();
      const moveHistory = this.chess.history({ verbose: true });
      const moveList = this.chess.pgn({ max_width: 5, newline_char: ' ' }); 
      // Convert bestMoveForWhiteUCI to LAN
      let bestMoveForWhiteLAN = convertUCItoLAN(bestMoveForWhiteUCI, this.chess.fen());
      if (!bestMoveForWhiteLAN) {
        console.error('Invalid best move for White:', bestMoveForWhiteUCI);
        return null;
      }
      // Get last move in LAN
      let lastMoveLAN = '';
      if (moveHistory.length > 0) {
        const lastMove = moveHistory[moveHistory.length - 1];
        lastMoveLAN = lastMove.lan;
      } else {
        lastMoveLAN = 'None';
      }
      const prompt = `
          You are a chess tutor.  
          You are the black and your last move was ${lastMoveLAN}.
          The current FEN is ${fen}.
          The move list is: ${moveList}.
          The best move for White is ${bestMoveForWhiteLAN}.
          Respond in the following format
          {
            "strategicAnalysisForBlack": "<A 200 character long strategic analysis for Black's last move>",
            "explanationForWhiteBestMove": "<A 200 character long explanation of why ${bestMoveForWhiteLAN} is the best move for White>"
          }`;
      try {
        console.log('Prompt to AI:', prompt);
        const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer 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`, // Replace with your OpenAI API key
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // or the appropriate model name
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: 200, // Adjust as needed
            temperature: 0.7, // Adjust as needed
        }),
        });
        const jsonResponse = await response.json();
        if (jsonResponse.error) {
          console.error('API Error:', jsonResponse.error);
          return null;
        }
        const responseText = jsonResponse.choices[0].message.content;
        const { strategicAnalysisForBlack, explanationForWhiteBestMove } = extractSectionsFromAdvice(
          responseText
        );
        return {
          analysisSummary: strategicAnalysisForBlack,
          adviceSummary: explanationForWhiteBestMove,
        };
    } catch (error) {
      console.error('Error fetching analysis from AI:', error);
      return null;
    }
  }
}
// Function to convert UCI castling moves to SAN
function convertCastlingUCItoSAN(moveUCI) {
  if (moveUCI === 'e1h1' || moveUCI === 'e1a1') {
    return 'O-O'; // Kingside castling
  } else if (moveUCI === 'e8a8' || moveUCI === 'e8h8') {
    return 'O-O-O'; // Queenside castling
  }
  return null; // Not a castling move
}

// Function to generate move list in LAN
function getMoveListLAN() {
  const history = this.chess.history({ verbose: true });
  return history
    .map((move) => {
      return move.lan;
    })
    .join(' ');
}

function extractSectionsFromAdvice(adviceText) {
  try {
    const cleanedText = adviceText.replace(/```(?:json)?/g, '').trim();
    const parsedResponse = JSON.parse(cleanedText);

    const strategicAnalysisForBlack = parsedResponse.strategicAnalysisForBlack;
    const explanationForWhiteBestMove = parsedResponse.explanationForWhiteBestMove;

    return { strategicAnalysisForBlack, explanationForWhiteBestMove };
  } catch (e) {
    console.error("Error parsing the assistant's response:", e);
    return {};
  }
}

function convertUCItoLAN(uciMove, fen) {
  const chessInstance = new Chess(fen);
  const moves = chessInstance.moves({ verbose: true });
  const move = moves.find(
    (m) =>
      m.from === uciMove.slice(0, 2) &&
      m.to === uciMove.slice(2, 4) &&
      (uciMove.length > 4 ? m.promotion === uciMove.slice(4) : true)
  );
  return move ? move.lan : null;
}

export default GameLogic;
