import { Chess } from 'chess.js';

class GameLogic {
  constructor() {
    //     chess.clear()
    // chess.fen()
    this.chess = new Chess();
    // this.chess.clear()
    // this.chess.fen()
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
  async getBestMoveFromLichess(fen, side) {
    const maxAttempts = 5;
    const retryDelay = 15000; // Wait 10 seconds between retries
    let attempt = 0;

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

        if (response.status === 429) {
          console.warn('Rate limit exceeded, waiting before retrying...');
          return 'rate_limit';
        }

        if (!response.ok) {
          throw new Error('Failed to fetch best move from Lichess');
        }

        const data = await response.json();
        // console.log(`Lichess API Response for ${side}:`, data);

        if (data.pvs && data.pvs.length > 0 && data.pvs[0].moves) {
          const bestMoveUCI = data.pvs[0].moves.split(' ')[0];
          const bestMoveSAN = this.convertCastlingUCItoSAN(bestMoveUCI) || this.convertUCItoSAN(bestMoveUCI, fen);

          return { uci: bestMoveUCI, san: bestMoveSAN };
        } else {
          console.error('No valid moves found in Lichess API response.');
          return null;
        }
      } catch (error) {
        console.error(`Error fetching ${side} move from Lichess:`, error);
        return null;
      }
    };

    return new Promise((resolve, reject) => {
      const retry = async () => {
        attempt++;
        console.log(`Attempt ${attempt} to fetch ${side} move from Lichess...`);

        const result = await tryFetchingBestMove();

        if (result && result !== 'rate_limit') {
          resolve(result); // Success
        } else if (result === 'rate_limit') {
          if (attempt < maxAttempts) {
            setTimeout(retry, retryDelay); // Wait and retry if rate-limited
          } else {
            reject(`Rate limit exceeded for ${side}, too many failed attempts.`);
          }
        } else if (attempt < maxAttempts) {
          setTimeout(retry, retryDelay); // Retry failed attempts
        } else {
          reject(`Failed to get ${side} move after ${maxAttempts} attempts.`);
        }
      };

      retry(); // Start retry loop
    });
  }
  async getAdviceFromGPT(prompt) {
    
 
    try {
      const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer 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`, // Replace with your OpenAI API key
        },
        body: JSON.stringify({
          
          model: 'gpt-4o', // or the appropriate model name
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 200, // Adjust as needed
          temperature: 0.1, // Adjust as needed
      }),
      });
      const jsonResponse = await response.json();
      if (jsonResponse.error) {
        console.error('API Error:', jsonResponse.error);
        return null;
      }
      const responseText = jsonResponse.choices[0].message.content;
      // console.log(`response text: ${responseText}`)
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
  async getAdviceFromGemini(prompt) {

    try {
      // console.log("Explanation Prompt: ", prompt);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE`, {
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
      // console.log("Gemini API response:", JSON.stringify(data, null, 2)); // Log full data in readable format
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
  async getAdviceFromPerplexity(prompt) {
  
    const response = await fetch(`https://api.perplexity.ai/chat/completions`,{
    method: 'POST',
    headers: {Authorization: 'Bearer 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', 
                              'Content-Type': 'application/json'},
    body: JSON.stringify({
      model:"llama-3.1-sonar-large-128k-online",
      messages:[
            {role:"system",
              content:"Double check piece types before responding."},
            { role:"user",
              content: prompt}
      ],
      max_tokens:"330",
      temperature:.75,
      top_p:0.75,
      return_citations:false,
      search_domain_filter:["perplexity.ai"],
      return_images:false,
      return_related_questions:false,
      search_recency_filter:"month",
      top_k:0,
      stream:false,
      presence_penalty:0,
      frequency_penalty:1.1
    })
    })
    data = await response.json();
    // console.log("Perplexity API response:", JSON.stringify(data, null, 2)); // Log full data in readable format
    // Extract the content from the response
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      let explanation = data.choices[0].message.content; // Adjust this depending on the exact content structure
      // const responseText = jsonResponse.choices[0].message.content;
      //  console.log(`explanation: ${explanation}`)
      const { strategicAnalysisForBlack, explanationForWhiteBestMove } = this.extractSectionsFromAdvice(
        explanation
      );
      return {
        analysisSummary: strategicAnalysisForBlack,
        adviceSummary: explanationForWhiteBestMove,
      };
    }
  }
  async getAdviceFromClaude(prompt) {
  

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01' , // Add this line
                'x-api-key': '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'
            },
            body: JSON.stringify({
                model: "claude-3-sonnet-20240229",
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
        // console.log("Claude API response:", JSON.stringify(data, null, 2));

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
    const fen = this.chess.fen();
    const moveHistory = this.chess.history({ verbose: true });
    const moveList = this.chess.pgn({ max_width: 5, newline_char: ' ' }); 
    const chessASCII = this.chess.ascii();
    // Convert bestMoveForWhiteUCI to LAN
    let bestMoveForWhiteLAN =  this.convertCastlingUCItoSAN(bestMoveForWhiteUCI) || this.convertUCItoLAN(bestMoveForWhiteUCI, this.chess.fen());
    if (!bestMoveForWhiteLAN) {
      console.error('Invalid best move for White:', bestMoveForWhiteUCI);
      return null;
    }
    // Get last move in LAN
    let lastMoveLAN = '';
    if (moveHistory.length > 0) {
      const lastMove = moveHistory[moveHistory.length - 1];
      lastMoveLAN = lastMove.san;
    } else {
      lastMoveLAN = 'None';
    }
    // You are the lowercase letters of this chess game (represented in ASCII):
    // ${chessASCII}

    const prompt = `
        You are a chess tutor.  
        You are black and your last move was ${lastMoveLAN}.
        It's white's (my) turn.
        you are the lowercase letters of the current FEN: ${this.chess.fen()}
        The move history is: ${moveList}.
        The best move for White is ${bestMoveForWhiteLAN}.
        Respond only with the JSON object in the exact format provided.
        When commenting on black, speak in the 1st person.  When commenting on white, speak in the 2nd
        When responding, double check that the piece you mention can legally do the move
        Respond in the following format
        {
          "strategicAnalysisForBlack": "Computer's move: ${lastMoveLAN}  <A 100 character long strategic analysis for Black's last move>",
          "explanationForWhiteBestMove": "Advice: ${bestMoveForWhiteLAN}  <A 100 character long explanation of why this is the best move for White>"
    }`;
    console.log("Explanation Prompt: ", prompt);
    switch (apiName) {
      case 'GPT':
        return await this.getAdviceFromGPT(prompt);
      case 'Gemini':
        return await this.getAdviceFromGemini(prompt);
      case 'Claude':
        return await this.getAdviceFromClaude(prompt);
        case 'Perplexity':
          return await this.getAdviceFromPerplexity(prompt);
  
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
    if (uciMove === 'e8h8' || uciMove === 'e1h1') {
      return 'O-O'; // Kingside castling
    } else if (uciMove === 'e8a8' || uciMove === 'e1a1') {
      return 'O-O-O'; // Queenside castling
    }
    return null;
  }
  
  extractSectionsFromAdvice(adviceText) {
  try {
    //  console.log(`advice text : ${adviceText}`);
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
