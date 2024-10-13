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
        // console.error('Lichess API error:', data.error);
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
  
  
  makeAIMove() {
    const possibleMoves = this.chess.moves(); // Get all possible moves
  
    if (possibleMoves.length === 0) {
      // console.error('No legal moves available for AI.');
      return null;  // No legal moves
    }
  
    // Log available moves to debug
    // console.log('Available moves for AI:', possibleMoves);
  
    // Select a random or the best move from possible moves
    const selectedMove = this.selectBestMove(possibleMoves);
  
    // Apply the selected move
    const moveResult = this.chess.move(selectedMove);
  
    if (!moveResult) {
      // console.error('AI failed to make a valid move.');
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
          
          model: 'gpt-4o-mini', // or the appropriate model name
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 200, // Adjust as needed
          temperature: 1, // Adjust as needed
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
    // console.error('Error fetching analysis from AI:', error);
    return null;
  }
  }
  async getAdviceFromGemini(prompt) {
//       const { GoogleGenerativeAI } = require("@google/generative-ai");
// const genAI = new GoogleGenerativeAI("AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE");
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// const result = await model.generateContent(prompt);
// console.log(result.response.text());

try {
  // console.log("Explanation Prompt: ", prompt);
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
  // console.error('Error fetching analysis from AI:', error);
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
  async getAdviceFromAPI(apiName,gameplanWhite, gameplanBlack) {
    const fen = this.chess.fen();
    const phase = this.getGamePhase();
    const boardLayout = this.chess.ascii();
    // const boardLayout = this.fenToBoardLayout(fen);
    const moveHistory = this.chess.history({ verbose: true }).map(move => {
      return move.from + move.to + (move.promotion ? move.promotion : '');
    });
    const moveList = this.chess.history({ verbose: true });
    const currentPGN = this.chess.pgn({ max_width: 5}); 
    const chessASCII = this.chess.ascii(); 
    //  console.log(`game plan white ${gameplanWhite}`);
    //  console.log(`game plan black ${gameplanBlack}`);

    const bestMoveForWhiteUCI =gameplanWhite.split(' ')[0];
    console.log(`bestMoveForWhiteUCI ${bestMoveForWhiteUCI}`);
    let bestMoveForWhiteLAN =  this.convertCastlingUCItoSAN(bestMoveForWhiteUCI) || this.convertUCItoLAN(bestMoveForWhiteUCI, this.chess.fen());
    console.log(`bestMoveForWhiteLAN ${bestMoveForWhiteLAN}`);

    if (!bestMoveForWhiteLAN) {
      // console.error('Invalid best move for White:', );
      return null;
    }
    // Get last move in LAN
    let lastMoveUCI = '';
    if (moveList.length > 0) {
      const lastMove = moveList[moveList.length - 1];
      lastMoveUCI = lastMove.from + lastMove.to + (lastMove.promotion ? lastMove.promotion : '');
    } else {
      lastMoveUCI = 'None';
    }
    // You are the lowercase letters of this chess game (represented in ASCII):
    // ${chessASCII}
    // "strategicAnalysisForBlack": "Computer's move: ${lastMoveLAN}  <A 80 character long strategic analysis for Black's last move>",
   // "strategicAnalysisForBlack": "is the sufficient information to derive an accurate analysis?  wwhat other information would help?",
  //  "input": {
  //   "fen": "r1bqkb1r/pppp1ppp/2n5/1B2p3/4n3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 5",
  //   "moveHistory": ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Nxe4"],
  //   "turn": "white",
  //   "gamePhase": "opening",
  //   "requestedOutput": {
  //     "strategicAnalysis": "A detailed analysis of the current position, focusing on tactical threats, strategic goals, and potential counterplay.",
  //     "bestMove": "The recommended best move for White."
  //   }
  // }
  
    // const prompt = `
    //     You are Magnus Carlsen.  
    //     It's white's (my) turn.
    //     Game phase: ${phase}
    //     You are the lowercase letters of the current FEN representation: ${this.chess.fen()}
    //     The move history is: ${moveHistory}.
    //     The best move for White is ${bestMoveForWhiteLAN}.
    //     `+
    //    //This is a visual representation of the board: 
    //     //${boardLayout}
    //     `This is the best strategic game plan for white: ${gameplanWhite}
    //     This is the best strategic game plan for black: ${gameplanBlack}
    //     Use all of this input to find existing grandmaster games online that have comments for these moves. If you find any, include these.
    //     Respond only with the JSON object in the exact format provided.
    //     When commenting on black, speak in the 1st person.  When commenting on white, speak in the 2nd
    //    ` +
    //    // When responding, double check the visual representation.
    //     `In your response, do not say anything unless you absolutely know it to be true.
    //     In your response, do not mention piece names.  Refer to pieces by position instead.
    //     Respond in the following format
    //     {
    //          "strategicAnalysisForBlack": "Computer's move: ${lastMoveUCI}  <A 80 character long strategic analysis for Black's last move>",
    //       "explanationForWhiteBestMove": "Advice: ${bestMoveForWhiteLAN}  <A 80 character long explanation of why this is the best move for White>"
    
    //       }`;
    const prompt = `
You are playing black and it is my turn.

This is the current state of the game use this to work out where the pieces are on the board:

FEN:  ${this.chess.fen()}
Move History: ${moveHistory}

In your response, do not mention piece names.  Refer to pieces by position instead.

Use the following single blob of JSON. Do not include any other information.

    {
         "strategicAnalysisForBlack": "Computer's move: ${lastMoveUCI}  A 20 word explanation of why this was a good move for Black",
      "explanationForWhiteBestMove": "Advice: ${bestMoveForWhiteLAN}  A 20 word explanation of why this is a good move for White"

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
console.log(strategicAnalysisForBlack);
console.log(explanationForWhiteBestMove);
    return { strategicAnalysisForBlack, explanationForWhiteBestMove };
  } catch (e) {
    // console.error("Error parsing the assistant's response:", e);
    return {};
  }
  }
  convertUCItoLAN(uciMove, fen) {
    const chessInstance = new Chess(fen);
    const moves = chessInstance.moves({ verbose: true });
    console.log(`moves ${moves}`);
    const move = moves.find(
      (m) =>
        m.from === uciMove.slice(0, 2) &&
        m.to === uciMove.slice(2, 4) &&
        (uciMove.length > 4 ? m.promotion === uciMove.slice(4) : true)
    );
    console.log(`move ${move}`);

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
