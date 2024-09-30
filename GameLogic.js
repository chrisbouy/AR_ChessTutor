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
        return data.pvs[0].moves.split(' ')[0]; // Return the best move
      } else {
        console.error('No moves found in Lichess API response.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching best move from Lichess:', error);
      return null;
    }
  }

  async getAdviceFromAI(bestMoveForWhite) {
    const fen = this.chess.fen();
    const moveHistory = this.chess.history({ verbose: true });
    const lastMove = moveHistory[moveHistory.length - 1];
    const moveList = moveHistory
      .map((move, index) => {
        const moveNumber = Math.floor(index / 2) + 1;
        return `${move.color === 'w' ? moveNumber + '.' : ''} ${move.san}`;
      })
      .join(' ');

    const prompt = `
      The last move for Black was ${lastMove.san}.
      The current FEN is ${fen}.
      The move list is: ${moveList}.
      The best move for White is ${bestMoveForWhite}.
      Explain why this is the best move for White in the current position.
      Also, provide a 200 character long strategic analysis of Black's last move.

      {
        "strategicAnalysisForBlack": "<200 character long strategic analysis for Black's last move>",
        "explanationForWhiteBestMove": "<Explanation of why ${bestMoveForWhite} is the best move for White in the current position>"
      }
    `;

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

export default GameLogic;
