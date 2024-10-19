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
    const board = this.chess.board(); // Get the board state from chess.js
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    return board.map((row, rowIndex) => {
      return row.map((piece, colIndex) => {
        const position = files[colIndex] + (8 - rowIndex); // 'a8', 'b8', etc.
        const squareColor = (rowIndex + colIndex) % 2 === 0 ? '#1594da' : '#c0dae6'; // Light and dark squares
        return {
          position,
          color: squareColor,
          piece: piece ? { type: piece.type, color: piece.color } : null,
        };
      });
    });
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
  makeMove(move) {
    try {
      // Get all legal moves for the current position
      // const legalMoves = this.chess.moves({ verbose: true });
  
      // // Check if the move is in the list of legal moves
      // const isMoveLegal = legalMoves.some((legalMove) => legalMove.san === move);
  
      // if (!isMoveLegal) {
      //   console.error(`Invalid move: ${move}`);
      //   return null;
      // }
  
      // Apply the move if it is valid
      const result = this.chess.move(move);
      return result || null;
    } catch (error) {
      // console.error('Error making move:', error);
      return null;
    }
  }
  getPieceAt(position) {
    const rowIndex = 8 - parseInt(position[1]);
    const colIndex = position.charCodeAt(0) - 'a'.charCodeAt(0);
    const piece = this.chess.board()[rowIndex][colIndex];
    return piece ? { type: piece.type, color: piece.color } : null;
  }  
  async getBestMoveFromLichess(color) {
    try {
      const fen = this.chess.fen();
      console.log(`Sending request to Lichess with FEN: ${fen}`);
      const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer lip_iioABYocYPTzLDGEnMrt`, // Replace with your Lichess API token
        },
      });
  
      const data = await response.json();
      if (data.error) {
        console.log('Lichess API error:', data.error);
        return null; // Return null to trigger AI fallback
      }
  
      // console.log('Lichess API Response:', data);
      if (data.pvs && data.pvs.length > 0) {
        let bestVariant = data.pvs[0];
        data.pvs.forEach((variant) => {
          if (variant.cp > bestVariant.cp) {
            bestVariant = variant;
          }
        });
        const bestMoveUCI = bestVariant.moves.split(' ')[0];
        const bestMoveSAN = this.convertCastlingUCItoSAN(bestMoveUCI) || this.convertUCItoSAN(bestMoveUCI, fen);
        if (bestMoveSAN) {
          return { uci: bestMoveUCI, san: bestMoveSAN, fullVariant: bestVariant.moves };
        } else {
          // console.error('Invalid best move from Lichess');
          return null;
        }
      } else {
        // console.error('No moves found in Lichess API response.');
        return null; // No moves, trigger fallback to AI
      }
    } catch (error) {
      // console.error('Error fetching best move from Lichess:', error);
      throw error; // Rethrow error to trigger fallback in App.js
    }
  }
  getAdvisedMoveFromAI_ForWhite() {
    const possibleMoves = this.chess.moves(); // Get all possible moves
    if (possibleMoves.length === 0) {
       console.error('No legal moves available for AI.');
      return null;  // No legal moves
    }
    // Log available moves to debug
     console.log('Available moves for AI:', possibleMoves);
    // Select a random or the best move from possible moves
    const selectedMove = this.selectBestMove(possibleMoves);
    const bestMoveUCI = this.convertSANtoUCI(selectedMove, this.chess.fen());

    return {
      uci: bestMoveUCI,  // Best move in UCI format
      san: moveResult.san,  // Best move in SAN format
    };
  }
  makeAIMoveForBlack() {
    const possibleMoves = this.chess.moves(); // Get all possible moves
    if (possibleMoves.length === 0) {
       console.error('No legal moves available for AI.');
      return null;  // No legal moves
    }
    // Log available moves to debug
     console.log('Available moves for AI:', possibleMoves);
  
    // Select a random or the best move from possible moves
    const selectedMove = this.selectBestMove(possibleMoves);
  
    // Apply the selected move
    const moveResult = this.chess.move(selectedMove);
  console.log(`from: ${moveResult.from} to: ${moveResult.to}`);

    if (!moveResult) {
       console.error('AI failed to make a valid move.');
      return null;  // Move failed, return null
    }
  
    const bestMoveUCI = moveResult.from + moveResult.to;
    const dummyFullVariant = [bestMoveUCI]; // Create a dummy variant with the best move as the first item
  
    return {
      move: moveResult, // Last move in verbose format
      boardState: this.getBoardState(),  // Updated board state
      status: this.getGameStatus(),  // Game status (e.g., ongoing, checkmate)
      fullVariant: dummyFullVariant.join(' '), // Return the dummy fullVariant array as a string
      uci: bestMoveUCI,  // Best move in UCI format
      san: moveResult.san,  // Best move in SAN format
    };
  }
  selectBestMove(possibleMoves) {
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }

  getBestVariantWithHighestCP(data) {
    if (!data.pvs || data.pvs.length === 0) {
        // console.error('No variants found in Lichess API response.');
        return null;
    }
    // Find the variant with the highest CP
    let highestCPVariant = data.pvs.reduce((bestVariant, currentVariant) => {
        return (currentVariant.cp > bestVariant.cp) ? currentVariant : bestVariant;
    }, data.pvs[0]); // Start with the first variant

    return highestCPVariant;
  }
  getGamePhase() {
    const moveCount = this.chess.history().length;
    if (moveCount <= 10) return 'Opening';
    if (moveCount <= 30) return 'Midgame';
    return 'Endgame';
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
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that provides responses strictly in the JSON format specified, without any additional text.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });
      const jsonResponse = await response.json();
      if (jsonResponse.error) {
        console.error('API Error:', jsonResponse.error);
        return null;
      }
      const responseText = jsonResponse.choices[0].message.content;
      const { openingName, openingAnalysis, recommendedNextMoves } = this.extractSectionsFromAdvice(responseText);
      return { openingName, openingAnalysis, recommendedNextMoves };
    } catch (error) {
      console.error('Error fetching analysis from AI:', error);
      return null;
    }
  }
  
  async getAdviceFromGemini(prompt) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE`, {
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
      console.log("Raw Gemini API response:", JSON.stringify(data, null, 2));      // Log the raw response from Gemini
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content){      // Extract the content from the response
        let responseText = data.candidates[0].content.parts[0].text; ;
        console.log('Raw AI Response:', responseText);
        // Extract the sections from the response
        const { openingName, openingAnalysis, recommendedNextMoves } = this.extractSectionsFromAdvice(responseText);
        console.log('Parsed Opening Name:', openingName);        // Log the parsed sections
        console.log('Parsed Opening Analysis:', openingAnalysis);
        console.log('Parsed Recommended Next Moves:', recommendedNextMoves);
        return { openingName, openingAnalysis, recommendedNextMoves };
      } else {
        console.error('No candidates found in Gemini API response.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching analysis from Gemini:', error);
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
        // console.error('Error fetching analysis from Claude:', error);
        return null;
    }
}
async getAdviceFromAPI(apiName) {
  const fen = this.chess.fen();
  const moveHistory = this.chess.history().map(move => move);

  const prompt = `
  You are a chess tutor specializing in chess openings. Based on the current game state, provide detailed information about the opening being played.
  
  Current FEN: ${fen}
  Move History: ${moveHistory.join(', ')}
  
  Instructions:
  - Identify the opening name based on the move history.
  - Explain the main ideas and objectives of this opening for both White and Black.
  - Provide recommended next moves and common variations.
  
  Important:
  - **Do not include move numbers when mentioning moves.**
  - **Return all values as plain strings. Do not include nested objects or arrays.**
  - **Do not include any additional text or explanations outside the JSON format.**
  - keep response under 80 words

  Please respond in the following JSON format:
  
  {
    "openingName": "<Name of the opening>",
    "openingAnalysis": "<Analysis of the opening's main ideas and objectives for both White and Black in plain text.>",
    "recommendedNextMoves": "<Suggested next moves for white and common variations without move numbers>"
  }
  `;
  

  switch (apiName) {
    case 'GPT':
      return await this.getAdviceFromGPT(prompt);
      case 'Gemini':
        return await this.getAdviceFromGemini(prompt);
    // ... other cases if any ...
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
  convertSANtoUCI(sanMove, fen) {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
  
    const move = moves.find((m) => m.san === sanMove);
  
    if (move) {
      return move.from + move.to + (move.promotion ? move.promotion : '');
    } else {
      return null; // Move not found
    }
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
      const cleanedText = adviceText.replace(/```(?:json)?/g, '').trim();
  
      // Log the cleaned text before parsing
      console.log('Cleaned AI Response:', cleanedText);
  
      const parsedResponse = JSON.parse(cleanedText);
  
      let { openingName, openingAnalysis, recommendedNextMoves } = parsedResponse;
  
      // Check if openingAnalysis is an object
      if (typeof openingAnalysis === 'object') {
        // Convert it to a string
        openingAnalysis = Object.entries(openingAnalysis)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      }
  
      // Similarly for recommendedNextMoves if needed
  
      return { openingName, openingAnalysis, recommendedNextMoves };
    } catch (e) {
      console.error("Error parsing the assistant's response:", e);
      console.log('Original AI Response:', adviceText);
      return {
        openingName: 'Unknown Opening',
        openingAnalysis: 'Unable to parse opening analysis.',
        recommendedNextMoves: 'No recommendations available.',
      };
    }
  }
  
  
  convertUCItoLAN(uciMove, fen) {
    const chessInstance = new Chess(fen);
    const moves = chessInstance.moves({ verbose: true });
   // console.log(`moves ${moves}`);
    const move = moves.find(
      (m) =>
        m.from === uciMove.slice(0, 2) &&
        m.to === uciMove.slice(2, 4) &&
        (uciMove.length > 4 ? m.promotion === uciMove.slice(4) : true)
    );
    //console.log(`move ${move}`);

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
