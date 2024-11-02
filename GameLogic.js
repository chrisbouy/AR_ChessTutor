import { Chess } from 'chess.js';
import { exp } from 'three/webgpu';

class GameLogic {
  constructor() {
    //     chess.clear()
    // chess.fen()
    this.chess = new Chess();
    this.latestAdvice = null; 
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
        const squareColor = (rowIndex + colIndex) % 2 === 0 ? '#c0dae6' :'#1594da' ; // Light and dark squares
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
  // getAdvisedMoveFromAI_White() {
  //   const possibleMoves = this.chess.moves(); // Get all possible moves
  //   if (possibleMoves.length === 0) {
  //      console.error('No legal moves available for AI.');
  //     return null;  // No legal moves
  //   }
  //   // Log available moves to debug
  //    console.log('Available moves for AI:', possibleMoves);
  //   // Select a random or the best move from possible moves
  //   const selectedMove = this.selectBestMove(possibleMoves);
  //   const bestMoveUCI = this.convertSANtoUCI(selectedMove, this.chess.fen());

  //   return {
  //     uci: bestMoveUCI,  // Best move in UCI format
  //   };
  // }
  async getBestMoveFromAI_Black() {
    try {
      const fen = this.chess.fen();
      const prompt = `You are a chess tutor, analyze the current FEN and respond with only the best move for Black in SAN notation. NO OTHER WORDS. Current FEN: ${fen}`;
  
      // Call your AI API (e.g., OpenAI) to get the best move
      const aiResponse = await this.callAIForMove_Black(prompt);
      console.log(`this is either black's first move or white has gone off script.  current fen: ${fen}.  ai move: ${aiResponse}`);
      const bestMoveSAN = aiResponse.trim();
  
      // Validate the move
      if (this.validateMove(bestMoveSAN)) {
        return bestMoveSAN;
      } else {

        console.error('AI suggested an invalid move:', bestMoveSAN);
        return null;
      }
    } catch (error) {
      console.error('Error fetching best move from AI:', error);
      return null;
    }
  }
  async callAIForMove_Black(prompt) {
    try {
      const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer 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`, // Use environment variable or secure storage
        },
        body: JSON.stringify({
          model: 'gpt-4o', 
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 100,
          temperature: 0,
        }),
      });
  
      const jsonResponse = await response.json();
      if (jsonResponse.error) {
        console.error('AI API Error:', jsonResponse.error);
        return null;
      }
  
      const aiMove = jsonResponse.choices[0].message.content;
      return aiMove;
    } catch (error) {
      console.error('Error calling AI API:', error);
      return null;
    }
  }
  async makeMove_Black() {
    try {
      const moveHistory = this.chess.history({ verbose: true });
      const isFirstMove = moveHistory.length === 1; // Only White has moved
  
      let blackMove = null;
  
      if (isFirstMove) {
        // First Black move: Get move from AI
        blackMove = await this.getBestMoveFromAI_Black();
        if (!blackMove) {
          // AI failed; make a random move
          blackMove = this.selectRandomMove();
        }
      } else {
        const userLastMove = moveHistory.slice(-1)[0];
        const userLastMoveSAN = userLastMove.san;
  
        if (this.latestAdvice && this.latestAdvice.recommendedNextMoves) {
          // Find if the user's move matches any of the AI's recommended moves
          const matchingAdvice = this.latestAdvice.recommendedNextMoves.find(
            (advice) => advice.whiteMove === userLastMoveSAN
          );
  
          if (matchingAdvice && matchingAdvice.blackResponses.length > 0) {
            // User took the AI's advice; pick one of the suggested black responses
            blackMove = this.selectBestResponse_Black(matchingAdvice.blackResponses);
          }
        }
  
        if (!blackMove) {
          // White went off script; get Black's move from AI
          blackMove = await this.getBestMoveFromAI_Black();
          if (!blackMove) {
            // AI failed; make a random move
            blackMove = this.selectRandomMove();
          }
        }
      }
  
      // Make the move
      const moveResult = this.chess.move(blackMove);
      if (moveResult) {
        console.log(`whites move: ${this.getLastWhiteMove().san}`);
        console.log(`blacks move: ${this.getLastBlackMove().san}`);
        
        return {
          move: moveResult,
          boardState: this.getBoardState(),
          status: this.getGameStatus(),
          uci: moveResult.from + moveResult.to,
          san: moveResult.san,
        };
      } else {
        console.error('Failed to make black move:', blackMove);
        return null;
      }
    } catch (error) {
      console.error('Error in makeMoveForBlack:', error);
      return null;
    }
  }
  selectBestResponse_Black(blackResponses) {
    // Filter out invalid moves
    const validMoves = blackResponses.filter((move) => this.validateMove(move));
    if (validMoves.length > 0) {
      const randomIndex = Math.floor(Math.random() * validMoves.length);
      return validMoves[randomIndex];
    } else {
      // If none of the suggested moves are valid, return null
      return null;
    }
  }
  selectRandomMove() {
    const possibleMoves = this.chess.moves();
    if (possibleMoves.length === 0) {
      console.error('No legal moves available.');
      return null;
    }
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }
  getGamePhase() {
    const moveCount = this.chess.history().length;
    if (moveCount <= 10) return 'Opening';
    if (moveCount <= 30) return 'Midgame';
    return 'Endgame';
  }
  async getAdviceFromGPT(system_prompt, user_prompt) {
    try {
      const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer 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`, // Replace with your OpenAI API key
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: system_prompt
            },
            {
              role: 'user',
              content: user_prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0,
        }),
      });
      const jsonResponse = await response.json();
      if (jsonResponse.error) {
        console.error('API Error:', jsonResponse.error);
        return null;
      }
      const responseText = jsonResponse.choices[0].message.content;
      // const { openingName, openingAnalysis, recommendedNextMoves } = this.extractSectionsFromAdvice(responseText);
      // return { openingName, openingAnalysis, recommendedNextMoves };
      const advice = this.extractSectionsFromAdvice(responseText);
      return advice;
    } catch (error) {
      console.error('Error fetching analysis from AI:', error);
      return null;
    }
  }
  async getAdviceFromGemini(system_prompt, user_prompt) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "contents": [
            {
              "role": "system",
              "parts": [{"text": system_prompt}]
            },
            {
              "role": "user",
              "parts": [{"text": user_prompt}]
            },
          ]
        }),
      });
      const data = await response.json();
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content){      // Extract the content from the response
        let responseText = data.candidates[0].content.parts[0].text; ;
        // Extract the sections from the response
        const { openingName, openingAnalysis, recommendedNextMoves } = this.extractSectionsFromAdvice(responseText);
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
  async getAdviceFromPerplexity(system_prompt, user_prompt) {
    const response = await fetch(`https://api.perplexity.ai/chat/completions`,{
    method: 'POST',
    headers: {Authorization: 'Bearer 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', 
                              'Content-Type': 'application/json'},
    body: JSON.stringify({
      model:"llama-3.1-sonar-small-128k-chat",
      messages:[
            {role:"system",
              content:system_prompt
            },
            { role:"user",
              content: user_prompt
            }
      ],
      max_tokens:"1000",
      temperature:0.3,
      top_p:0.8,
      return_citations:false,
      search_domain_filter:["https://www.chess.com"],
      return_images:false,
      return_related_questions:false,
      //search_recency_filter:"month",
      top_k:0,
      stream:false,
      presence_penalty:0,
      frequency_penalty:0.5
    })
    })
    data = await response.json();
    // Extract the content from the response
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      let explanation = data.choices[0].message.content; // Adjust this depending on the exact content structure
      // const responseText = jsonResponse.choices[0].message.content;
      //  console.log(`explanation: ${explanation}`)
      const { openingName, openingAnalysis, recommendedNextMoves } = this.extractSectionsFromAdvice(explanation);
      return { openingName, openingAnalysis, recommendedNextMoves };
    }
  }
  async getAdviceFromClaude(system_prompt, user_prompt) {
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01' , // Add this line
                'x-api-key': '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'
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1000,
                messages: [
                    {
                        role: "system",
                        content: system_prompt
                    },
                    {
                      role: "user",
                      content: user_prompt
                  },
                ]
            })
        });

        const data = await response.json();

        if (data && data.content && data.content[0] && data.content[0].text) {
            let explanation = data.content[0].text;
            const { openingName, openingAnalysis, recommendedNextMoves } = this.extractSectionsFromAdvice(explanation);
            return { openingName, openingAnalysis, recommendedNextMoves };
        }
    } catch (error) {
        // console.error('Error fetching analysis from Claude:', error);
        return null;
    }
  }
  async getAdviceFromAPI(apiName) {
    const fen = this.chess.fen();
    const moveHistory = this.chess.history().map(move => move);
  const system_prompt = `
  You are a chess tutor specializing in chess openings.
  Your task is to analyze openings based on the FEN and move history provided by the user.
  Use only information from https://www.chess.com to identify the opening and analyze it.
  Responses must be concise strings and formatted strictly according to the specified JSON structure.
  For each recommended White move, you should provide possible Black responses.
  Do not include move numbers in the response.
  `;
  // User Prompt: Only dynamic input from the user
  const user_prompt = `
  Current FEN: ${fen}
  Move History: ${moveHistory.join(', ')}
  Please respond in the following JSON format:
  {
    "openingName": "Name of the White's opening",
    "openingAnalysis": "Analysis of only the most recent move for both White and Black.",
    "recommendedNextMoves": [
      {
        "whiteMove": "<Suggested move for White>",
        "blackResponses": ["<Possible response 1>", "<Possible response 2>", "..."]
      },
      // ... more recommended moves
    ]  }
  `;
//  console.log(prompt);
    switch (apiName) {
      case 'GPT':
        return await this.getAdviceFromGPT(system_prompt, user_prompt);
        case 'Gemini':
          return await this.getAdviceFromGemini(system_prompt, user_prompt);
          case 'Perplexity':
            return await this.getAdviceFromPerplexity(system_prompt, user_prompt);   
            case 'Claude':
              return await this.getAdviceFromClaude(system_prompt, user_prompt);    
      // ... other cases if any ...
      default:
        throw new Error(`Unknown API name: ${apiName}`);
    }
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
      console.log(adviceText);
      const cleanedText = adviceText.replace(/```(?:json)?/g, '').trim();
      const parsedResponse = JSON.parse(cleanedText);
      const { openingName, openingAnalysis, recommendedNextMoves } = parsedResponse;
      return { openingName, openingAnalysis, recommendedNextMoves };
    } catch (e) {
      console.error("Error parsing the assistant's response:", e);
      return null;
    }
  }
  validateMove(sanMove) {
    const moves = this.chess.moves({ verbose: true });
    return moves.some((move) => move.san === sanMove);
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
  getLastMoveByColor(color) {
    const history = this.chess.history({ verbose: true });
    // Filter for the most recent move of the specified color
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].color === color) {
        return history[i];
      }
    }
    return null; // No moves found for that color
  }
  getLastWhiteMove() {
    return this.getLastMoveByColor('w'); // 'w' for White
  }
  getLastBlackMove() {
    return this.getLastMoveByColor('b'); // 'b' for Black
  }
  getLegalMoves(position) {
    return this.chess.moves({ square: position, verbose: true });
  }
  convertMoveToDescription(sanMove, color) {
    // Get the current FEN
    const originalFEN = this.chess.fen();

    // Modify the FEN to switch the turn if necessary
    let modifiedFEN = originalFEN;
    if (color === 'b') {
        // FEN format: [FEN position] [turn] [castling] [en passant] [halfmove clock] [fullmove number]
        const fenParts = originalFEN.split(' ');
        fenParts[1] = 'b'; // Set turn to Black
        modifiedFEN = fenParts.join(' ');
    } else if (color === 'w') {
        const fenParts = originalFEN.split(' ');
        fenParts[1] = 'w'; // Ensure turn is White
        modifiedFEN = fenParts.join(' ');
    }

    // Create a new chess instance with the modified FEN
    const tempChess = new Chess(modifiedFEN);

    // Get all possible moves for the current turn
    const moves = tempChess.moves({ verbose: true });

    // Find the move matching the SAN notation
    const move = moves.find((m) => m.san === sanMove);

    if (move) {
        const pieceName = this.getPieceName(move.piece);
        const from = move.from.toUpperCase();
        const to = move.to.toUpperCase();
        const action = move.captured ? 'captures on' : 'to';
        const promotion = move.promotion ? ` and promotes to ${this.getPieceName(move.promotion)}` : '';
        return `${pieceName} from ${from} ${action} ${to}${promotion}`;
    }

    // If move not found, return the SAN notation
    return sanMove;
}

  
  getPieceName(pieceSymbol) {
    const pieceNames = {
      p: 'Pawn',
      n: 'Knight',
      b: 'Bishop',
      r: 'Rook',
      q: 'Queen',
      k: 'King',
    };
    return pieceNames[pieceSymbol.toLowerCase()] || 'Piece';
  }
  
}
export default GameLogic;
