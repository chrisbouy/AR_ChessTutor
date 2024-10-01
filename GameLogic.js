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
    const maxAttempts = 10; // Retry up to 10 times (assuming about 6 seconds per attempt)
    const retryDelay = 6000; // Wait 6 seconds between retries
    let attempt = 0;

    // Helper function to attempt fetching move
    const tryFetchingBestMove = async () => {
      try {
        const response = await fetch(
          `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer lip_iioABYocYPTzLDGEnMrt`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch best move from Lichess');
        }

        const data = await response.json();
        console.log('Lichess API Response:', data);

        if (data.pvs && data.pvs.length > 0 && data.pvs[0].moves) {
          const bestMoveUCI = data.pvs[0].moves.split(' ')[0];
          const bestMoveSAN = this.convertCastlingUCItoSAN(bestMoveUCI) || this.convertUCItoSAN(bestMoveUCI, fen);

          if (bestMoveSAN) {
            return { uci: bestMoveUCI, san: bestMoveSAN };
          } else {
            console.error('Invalid best move from Lichess');
            return null;
          }
        } else {
          console.error('No moves found in Lichess API response.');
          return null;
        }
      } catch (error) {
        console.error('Error fetching best move from Lichess:', error);
        return null;
      }
    };

    // Retry logic
    return new Promise((resolve, reject) => {
      const retry = async () => {
        attempt++;
        console.log(`Attempt ${attempt} to fetch best move from Lichess...`);

        const result = await tryFetchingBestMove();

        if (result) {
          resolve(result);  // Successfully got the best move, resolve the promise
        } else if (attempt < maxAttempts) {
          setTimeout(retry, retryDelay); // Wait and retry
        } else {
          reject('Failed to get the best move after multiple attempts.');
        }
      };

      retry(); // Start the first attempt
    });
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
        const bestMoveSAN = this.convertCastlingUCItoSAN(bestMoveUCI);
        if ( bestMoveSAN) {
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
  async getAdviceFromGPT(bestMoveForWhiteUCI) {
    const fen = this.chess.fen();
    const moveHistory = this.chess.history({ verbose: true });
    const moveList = this.chess.pgn({ max_width: 5, newline_char: ' ' }); 
    // Convert bestMoveForWhiteUCI to LAN
    let bestMoveForWhiteLAN = this.convertUCItoLAN(bestMoveForWhiteUCI, this.chess.fen());
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
      console.log(`response text: ${responseText}`)
      const { strategicAnalysisForBlack, explanationForWhiteBestMove } = this.extractSectionsFromAdvice(
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
  async getAdviceFromGemini(bestMoveForWhiteUCI) {
    const fen = this.chess.fen();
    const moveHistory = this.chess.history({ verbose: true });
    const moveList = this.chess.pgn({ max_width: 5, newline_char: ' ' }); 
    // Convert bestMoveForWhiteUCI to LAN
    let bestMoveForWhiteLAN = this.convertUCItoLAN(bestMoveForWhiteUCI, this.chess.fen());
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
      console.log("Explanation Prompt: ", prompt);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "contents": [
            {
              "role": "user",
              "parts": [{"text": prompt}]
            }
          ]
        }),
      });
      const data = await response.json();
      console.log("Gemini API response:", JSON.stringify(data, null, 2)); // Log full data in readable format
      // Extract the content from the response
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        let explanation = data.candidates[0].content.parts[0].text; // Adjust this depending on the exact content structure
        // const responseText = jsonResponse.choices[0].message.content;
        // console.log(`response text: ${responseText}`)
        const { strategicAnalysisForBlack, explanationForWhiteBestMove } = this.extractSectionsFromAdvice(
          explanation
        );
        return {
          analysisSummary: strategicAnalysisForBlack,
          adviceSummary: explanationForWhiteBestMove,
        };
      }
    } catch (error) {
      console.error('Error fetching analysis from AI:', error);
      return null;
    }
  }
  async getAdviceFromPerplexity(bestMoveForWhiteUCI) {
    const fen = this.chess.fen();
    const moveHistory = this.chess.history({ verbose: true });
    const moveList = this.chess.pgn({ max_width: 5, newline_char: ' ' }); 
    // Convert bestMoveForWhiteUCI to LAN
    let bestMoveForWhiteLAN = this.convertUCItoLAN(bestMoveForWhiteUCI, this.chess.fen());
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
    console.log("Explanation Prompt: ", prompt);
    const response = await fetch(`https://api.perplexity.ai/chat/completions`,{
    method: 'POST',
    headers: {Authorization: 'Bearer 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', 
                              'Content-Type': 'application/json'},
    body: JSON.stringify({
      model:"llama-3.1-sonar-small-128k-online",
      messages:[
            {role:"system",
              content:"Be precise and concise."},
            { role:"user",
              content: prompt}
      ],
      max_tokens:"330",
      temperature:0.2,
      top_p:0.9,
      return_citations:true,
      search_domain_filter:["perplexity.ai"],
      return_images:false,
      return_related_questions:false,
      search_recency_filter:"month",
      top_k:0,
      stream:false,
      presence_penalty:0,
      frequency_penalty:1
    })
    })
    data = await response.json();
    console.log("Perplexity API response:", JSON.stringify(data, null, 2)); // Log full data in readable format
    // Extract the content from the response
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      let explanation = data.choices[0].message.content; // Adjust this depending on the exact content structure
      // const responseText = jsonResponse.choices[0].message.content;
       console.log(`explanation: ${explanation}`)
      const { strategicAnalysisForBlack, explanationForWhiteBestMove } = this.extractSectionsFromAdvice(
        explanation
      );
      return {
        analysisSummary: strategicAnalysisForBlack,
        adviceSummary: explanationForWhiteBestMove,
      };
    }
  }
  async getAdviceFromClaude(bestMoveForWhiteUCI) {
    const fen = this.chess.fen();
    const moveHistory = this.chess.history({ verbose: true });
    const moveList = this.chess.pgn({ max_width: 5, newline_char: ' ' }); 
    let bestMoveForWhiteLAN = this.convertUCItoLAN(bestMoveForWhiteUCI, this.chess.fen());
    if (!bestMoveForWhiteLAN) {
      console.error('Invalid best move for White:', bestMoveForWhiteUCI);
      return null;
    }
    let lastMoveLAN = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1].lan : 'None';

    const prompt = `
        You are a chess tutor.  
        You are the black and your last move was ${lastMoveLAN}.
        The current FEN is ${fen}.
        The move list is: ${moveList}.
        The best move for White is ${bestMoveForWhiteLAN}.
        Respond **only** with the JSON object in the exact format provided.
        Respond in the following format
        {
          "strategicAnalysisForBlack": "<A 200 character long strategic analysis for Black's last move>",
          "explanationForWhiteBestMove": "<A 200 character long explanation of why ${bestMoveForWhiteLAN} is the best move for White>"
        }`;

    try {
        console.log("Explanation Prompt: ", prompt);
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01' , // Add this line
                'x-api-key': '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'
            },
            body: JSON.stringify({
                model: "claude-3-opus-20240229",
                max_tokens: 1000,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        });

        const data = await response.json();
        console.log("Claude API response:", JSON.stringify(data, null, 2));

        if (data && data.content && data.content[0] && data.content[0].text) {
            let explanation = data.content[0].text;
            const { strategicAnalysisForBlack, explanationForWhiteBestMove } = this.extractSectionsFromAdvice(explanation);
            return {
                analysisSummary: strategicAnalysisForBlack,
                adviceSummary: explanationForWhiteBestMove,
            };
        }
    } catch (error) {
        console.error('Error fetching analysis from Claude:', error);
        return null;
    }
}
  async getAdviceFromAPI(apiName, bestMoveForWhiteUCI) {
    switch (apiName) {
      case 'GPT':
        return await this.getAdviceFromGPT(bestMoveForWhiteUCI);
      case 'Gemini':
        return await this.getAdviceFromGemini(bestMoveForWhiteUCI);
      case 'Claude':
        return await this.getAdviceFromClaude(bestMoveForWhiteUCI);
        case 'Perplexity':
          return await this.getAdviceFromPerplexity(bestMoveForWhiteUCI);
  
      default:
        throw new Error(`Unknown API name: ${apiName}`);
    }
  }
  generateChessPrompt(bestMoveForWhiteLAN) {
    const fen = this.chess.fen();
    const moveHistory = this.chess.history({ verbose: true });
    const moveList = this.chess.pgn({ max_width: 5, newline_char: ' ' });

    return `
      You are a chess tutor.  
      You are Black and your last move was ${moveHistory.length > 0 ? moveHistory[moveHistory.length - 1].lan : 'None'}.
      The current FEN is ${fen}.
      The move list is: ${moveList}.
      The best move for White is ${bestMoveForWhiteLAN}.
      Provide advice and analysis.
    `;
  }
  convertUCItoSAN(uciMove, fen) {
    const chessInstance = new Chess(fen);
    const moves = chessInstance.moves({ verbose: true });
    const move = moves.find(
      (m) =>
        m.from === uciMove.slice(0, 2) &&
        m.to === uciMove.slice(2, 4) &&
        (uciMove.length > 4 ? m.promotion === uciMove.slice(4) : true)
    );
    return move ? move.san : null;
  }
  convertCastlingUCItoSAN(uciMove) {
    if (uciMove === 'e1h1' || uciMove === 'e1a1') {
      return 'O-O'; // Kingside castling
    } else if (uciMove === 'e8a8' || uciMove === 'e8h8') {
      return 'O-O-O'; // Queenside castling
    }
    return null;
  }
  
  extractSectionsFromAdvice(adviceText) {
  try {
     console.log(`advice text : ${adviceText}`);
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
 convertUCItoLAN(uciMove, fen) {
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
 getMoveListLAN() {
  const history = this.chess.history({ verbose: true });
  return history
    .map((move) => {
      return move.lan;
    })
    .join(' ');
}
}
// Function to convert UCI castling moves to SAN
// function convertCastlingUCItoSAN(moveUCI) {
//   if (moveUCI === 'e1h1' || moveUCI === 'e1a1') {
//     return 'O-O'; // Kingside castling
//   } else if (moveUCI === 'e8a8' || moveUCI === 'e8h8') {
//     return 'O-O-O'; // Queenside castling
//   }
//   return null; // Not a castling move
// }
// Function to generate move list in LAN


export default GameLogic;
