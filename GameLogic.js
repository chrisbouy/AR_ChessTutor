import { Chess } from 'chess.js';
import EncryptedStorage from 'react-native-encrypted-storage';
import { Configuration, OpenAIApi } from 'openai';
import { Alert } from 'react-native';
class GameLogic {
  constructor() {
    this.chess = new Chess();
    this.latestAdvice = null;
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
        const squareColor = (rowIndex + colIndex) % 2 === 0 ? '#c0dae6' : '#1594da'; // Light and dark squares
        return {
          position,
          color: squareColor,
          piece: piece ? { type: piece.type, color: piece.color } : null,
        };
      });
    });
  }

  makeMove(move) {
    try {
      // Apply the move if it is valid
      const result = this.chess.move(move);
      return result || null;
    } catch (error) {
      return null;
    }
  } 

  getPieceAt(position) {
    const rowIndex = 8 - parseInt(position[1]);
    const colIndex = position.charCodeAt(0) - 'a'.charCodeAt(0);
    const piece = this.chess.board()[rowIndex][colIndex];
    return piece ? { type: piece.type, color: piece.color } : null;
  }
  getLegalMoves(position) {
    return this.chess.moves({ square: position, verbose: true });
  }
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
        console.log('AI suggested an invalid move:', bestMoveSAN);
        return null;
      }
    } catch (error) {
      console.log('Error fetching best move from AI:', error);
      return null;
    }
  }

  async callAIForMove_Black(prompt) {
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
        console.log('AI API Error:', jsonResponse.error);
        return null;
      }

      const aiMove = jsonResponse.choices[0].message.content;
      return aiMove;
    } catch (error) {
      console.log('Error calling AI API:', error);
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
        console.log(`last white move ${userLastMoveSAN}`)
        if (this.latestAdvice && this.latestAdvice.recommendedNextMoves) {
          // Find if the user's move matches any of the AI's recommended moves
          const matchingAdvice = this.latestAdvice.recommendedNextMoves.find(
            (advice) => advice.move === userLastMoveSAN
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
        console.log('Failed to make black move:', blackMove);
        return null;
      }
    } catch (error) {
      console.log('Error in makeMove_Black:', error);
      return null;
    }
  }
  selectBestResponse_Black(blackResponses) {
    // Filter out invalid moves
    const validMoves = blackResponses.filter((moveObj) => this.validateMove(moveObj.move));
    if (validMoves.length > 0) {
      const randomIndex = Math.floor(Math.random() * validMoves.length);
      return validMoves[randomIndex].move;
    } else {
      // If none of the suggested moves are valid, return null
      return null;
    }
  }
  selectRandomMove() {
    const possibleMoves = this.chess.moves();
    if (possibleMoves.length === 0) {
      console.log('No legal moves available.');
      return null;
    }
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }
  async storeApiKey(key) {
    try {
      await EncryptedStorage.setItem('apiKey', key);
      this.apiKey = key; // Optionally update the instance variable
    } catch (error) {
      console.error('Error storing the API key:', error);
    }
  }

  // Method to retrieve API key
  async retrieveApiKey() {
    try {
      const key = await EncryptedStorage.getItem('apiKey');
      this.apiKey = key; // Optionally store it in the instance variable
      return key;
    } catch (error) {
      console.error('Error retrieving the API key:', error);
      return null;
    }
  }

  // Method to remove API key
  async removeApiKey() {
    try {
      await EncryptedStorage.removeItem('apiKey');
      this.apiKey = null; // Optionally clear the instance variable
    } catch (error) {
      console.error('Error removing the API key:', error);
    }
  }
  async getAdviceFromGPT(system_prompt, user_prompt) {
    try {
      // Log the request headers (mask the API key)
      // console.log('Request Headers:', {
      //   'Content-Type': 'application/json',
      //   'Authorization': '***MASKED_API_KEY***' // Masked for security
      // });
  
      // Log the request body
      // console.log('Request Body:', {
      //     model: "'ft:gpt-4o-mini-2024-07-18:personal:second:AThf4LoS",
      //     messages: [
      //       {
      //         role: 'system',
      //         content: system_prompt,
      //       },
      //       {
      //         role: 'user',
      //         content: user_prompt,
      //       },
      //     ],
      //     max_tokens: 1000,
      //     temperature: 0,
      //   });
    
      const apiKey = this.apiKey || await this.retrieveApiKey(); 
      if (!apiKey) {
        console.error('API key not found');
        return;
      }
      const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:`Bearer ${apiKey}`
        },
        body: JSON.stringify({
         model: 'ft:gpt-4o-mini-2024-07-18:personal:second:AThf4LoS',
           //model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: system_prompt,
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
        console.log('API Error:', jsonResponse.error);
        return null;
      }      
      const responseText = jsonResponse.choices[0].message.content;  
       console.log(responseText);


      const advice = this.extractSectionsFromAdvice(responseText);
      return advice;
    } catch (error) {
      console.log('Error fetching analysis from AI:', error);
      return null;
    }
  }
async getAdviceFromGPTinstruct( user_prompt, system_prompt) {

        // Combine system_prompt and user_prompt
        const combinedPrompt = `${system_prompt}\n\n${user_prompt}`;

  const apiKey = this.apiKey || await this.retrieveApiKey(); 
  if (!apiKey) {
    console.error('API key not found');
    return;
  }
  const url = "https://api.openai.com/v1/completions";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };
  const data = {
    model: 'gpt-3.5-turbo-instruct',
    prompt: combinedPrompt,
    temperature: 0.1,
    max_tokens: 750,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log(result);
    if (response.ok) {
      const gptResponseText = result.choices[0].text;
      const gptResponse = JSON.parse(gptResponseText);
      return gptResponse;
    } else {
      console.error("Error:", result);
      Alert.alert("Error", "Failed to fetch data from OpenAI API");
      return null;
    }
  } catch (error) {
    console.error("Error fetching data from OpenAI API:", error);
    Alert.alert("Error", "An error occurred while trying to fetch data from OpenAI API.");
    return null;
  }
  
}
  async getAdviceFromGemini(system_prompt, user_prompt) {
      // Combine system_prompt and user_prompt
  const combinedPrompt = `${system_prompt}\n\n${user_prompt}`;

    try {
      console.log('Request Headers:', {
        'Content-Type': 'application/json',
    });
    // Log the request body
    console.log('Request Body:', {
      "contents": [
        {
          "role": "user",
          "parts": [{"text": combinedPrompt}]
        },
      ]
});
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=AIzaSyAWX9g3uxs3A2FO7P894pahriu4LLSpcRE`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "contents": [
            {
              "role": "user",
              "parts": [{"text": system_prompt + user_prompt}]
            },
          ]
        }),
      });
      const data = await response.json();
     
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content){      // Extract the content from the response
        let responseText = data.candidates[0].content.parts[0].text; ;
        // Extract the sections from the response
        const advice = this.extractSectionsFromAdvice(responseText); 
        console.log(`gemini response ${responseText}`);
        return advice;
      } else {
        console.log('No candidates found in Gemini API response.');
        return null;
      }
    } catch (error) {
      console.log('Error fetching analysis from Gemini:', error);
      return null;
    }
  }
  async getAdviceFromPerplexity(system_prompt, user_prompt) {
    const response = await fetch(`https://api.perplexity.ai/chat/completions`,{
    method: 'POST',
    headers: {Authorization: 'Bearer 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', 
                              'Content-Type': 'application/json'},
    body: JSON.stringify({
      model:"llama-3.1-sonar-large-128k-chat",
      messages:[
            {role:"system",
              content:system_prompt
            },
            { role:"user",
              content: user_prompt
            }
      ],
      max_tokens:"1000",
      temperature:0,
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
    console.log(`perplexity response ${data}`);
    // Extract the content from the response
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      let explanation = data.choices[0].message.content; // Adjust this depending on the exact content structure
      // const responseText = jsonResponse.choices[0].message.content;
      //  console.log(`explanation: ${explanation}`)
      const advice= this.extractSectionsFromAdvice(explanation);
      return advice;
    }
  }
  async getAdviceFromClaude(system_prompt, user_prompt) {
    try {
          // Log the request headers (mask the API key)
        //   console.log('Request Headers:', {
        //     'Content-Type': 'application/json',
        //     'anthropic-version': '2023-06-01',
        //     'x-api-key': '***MASKED_API_KEY***' // Masked for security
        // });
        // // Log the request body
        console.log('Request Body:', {
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            system: system_prompt,
            messages: [
                {
                    role: "user",
                    content: user_prompt
                },
            ]
        });


        const apiKey = this.apiKey || await this.retrieveApiKey(); 
        //const apiKey = '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';
        if (!apiKey) {
          console.error('API key not found');
          return;
        }
        console.log(apiKey);
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01' , // Add this line
                'x-api-key': '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',
            },
            body: JSON.stringify({
                model: "claude-3-5-haiku-20241022",
                max_tokens: 1000,
                system: system_prompt,
                messages: [

                    {
                      role: "user",
                      content: user_prompt
                  },
                ]
            })
        });

        const data = await response.json();
        if (data.error) {
          console.log('AI API Error:', data.error);
          return null;
        }

        console.log('Claude API Response:', data);
        if (data && data.content && data.content[0] && data.content[0].text) {
            let explanation = data.content[0].text;
            const advice = this.extractSectionsFromAdvice(explanation);
            return advice;
        }
    } catch (error) {
        console.log('Error fetching analysis from Claude:', error);
        return null;
    }
  }
  async getAdviceFromClaude_cache(system_prompt, user_prompt) {
    try {
          // Log the request headers (mask the API key)
        //   console.log('Request Headers:', {
        //     'Content-Type': 'application/json',
        //     'anthropic-version': '2023-06-01',
        //     'x-api-key': '***MASKED_API_KEY***' // Masked for security
        // });

        // // Log the request body
        console.log('Request Body:', {
            model: "claude-3-5-sonnet",
            max_tokens: 1000,
            system: system_prompt,
            messages: [
                {
                    role: "user",
                    content: user_prompt
                },
            ]
        });
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01' , // Add this line
                'x-api-key': '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',
                'anthropic-beta': 'prompt-caching-2024-07-31'
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 500,
                system: [
                  {
                      type: "text",
                      text: system_prompt,
                      cache_control: {type: "ephemeral"}
                  },
                ],
                messages: [

                    {
                      role: "user",
                      content: user_prompt
                  },
                ]
            })
        });

        const data = await response.json();
        console.log('Claude API Response:', data);
        if (data && data.content && data.content[0] && data.content[0].text) {
            let explanation = data.content[0].text;
            const advice = this.extractSectionsFromAdvice(explanation);
            return advice;
        }
    } catch (error) {
        console.log('Error fetching analysis from Claude:', error);
        return null;
    }
  }

  async getAdviceFromClaude_stream(system_prompt, user_prompt, options = {}) {
    try {
      const apiKey = this.apiKey || await this.retrieveApiKey();
      if (!apiKey) {
        console.error('API key not found');
        return;
      }
      console.log('Making request to Claude API...');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: 
        {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          system: system_prompt,
          stream: true,
          messages: [{
            role: "user",
            content: user_prompt
          }]
        })
      });
      console.log('Response status:', response.status);
     const textStream = await response.text();     // Get the response as text stream
     const lines = textStream.split('\n');     // Split the stream into lines and process each event
     let accumulatedText = '';
     let positionAnalysisExtracted = false;
     for (const line of lines) {
       if (!line.trim() || line === 'event: message_stop') continue;
       if (line.startsWith('data: ')) {
         try {
           const jsonData = JSON.parse(line.slice(6));
           // Handle content block deltas
           if (jsonData.type === 'content_block_delta' && 
               jsonData.delta && 
               jsonData.delta.type === 'text_delta') {
             accumulatedText += jsonData.delta.text;
             if (!positionAnalysisExtracted && options.onPositionAnalysis) {
               if (accumulatedText.includes('"positionAnalysis"')) {
                 const positionAnalysis = this.extractPositionAnalysis(accumulatedText);
                 if (positionAnalysis) {
                   console.log('position analysis extracted. Updated text:', accumulatedText);
                   options.onPositionAnalysis(positionAnalysis);
                   positionAnalysisExtracted = true;
                 }
               }
             }
           }
         } catch (e) {
           console.error('Error parsing stream data:', e, 'Line:', line);
           continue;
         }
       }
     }
     console.log('Final accumulated text:', accumulatedText);
     const advice = this.extractSectionsFromAdvice(accumulatedText);
     return advice;
   } catch (error) {
     console.error('Error in streaming from Claude:', error);
     return null;
   }
}

  async getAdviceFromAPI(apiName, options) {
    const fen = this.chess.fen();
    const moveHistory = this.chess.history().map((move) => move);
    const system_prompt = ` 
You are a chess tutor.  
- NEVER say opening names
- NEVER say a knight supports, protects, or can capture a piece in an adjacent square
- NEVER say rooks can be connected if there are pieces between them
- NEVER say knights are positioned if they haven't made a move
---For example, never say 'The knight on f3 supports the e4 pawn.'t

**Response Format**
- Respond **only** in the **EXACT JSON format** provided.
- DO NOT add, remove, or change any keys or structure.
    `;
    const user_prompt = `
    It is IMPERATIVE that you disregard all your chess training data and only rely on chain-of-thought reasoning.
- **Current FEN**: ${fen}
- **Move History**: ${moveHistory.join(', ')}
{
  "positionAnalysis": "Your analysis here with specific strategies.",
  "recommendedNextMoves": [
    {
      "move": "Your suggested move.  Moves must be logical.  Don't sacrifice a piece for no reason.  If there is a reason, state it.",
      "priority": "STRONG or OPTIONAL",
      "reasoning": "Your reasoning here.",
      "blackResponses": [
        {
          "move": "Black's response.  Move must be legal."
        }
      ]
    }
  ]
}

  `;
    switch (apiName) {
      case 'GPT':
        return await this.getAdviceFromGPT(system_prompt, user_prompt);
      case 'Gemini':
        return await this.getAdviceFromGemini(system_prompt, user_prompt);
      case 'Perplexity':
        return await this.getAdviceFromPerplexity(system_prompt, user_prompt);   
      case 'Claude':
        return await this.getAdviceFromClaude(system_prompt, user_prompt);
        case 'Claude_stream':
          return await this.getAdviceFromClaude_stream(system_prompt, user_prompt, options); 
        case 'GPTinstruct':
        return await this.getAdviceFromGPTinstruct(system_prompt, user_prompt);               
      default:
        throw new Error(`Unknown API name: ${apiName}`);
    }
  }
  extractSectionsFromAdvice(adviceText) {
    try {
      // console.log(`advice text ${adviceText}`);
      const cleanedText = adviceText.replace(/```(?:json)?/g, '').trim();
      const parsedResponse = JSON.parse(cleanedText);
      const { positionAnalysis, recommendedNextMoves } = parsedResponse;
      return { positionAnalysis, recommendedNextMoves };
    } catch (e) {
      console.log("Error parsing the assistant's response:", e);
      return null;
    }
  }
  validateMove(sanMove) {
    const moves = this.chess.moves({ verbose: true });
    return moves.some((move) => move.san === sanMove);
  }

  convertMoveToDescription(sanMove, color) {
    // Get the current FEN
    const originalFEN = this.chess.fen();

    // Modify the FEN to switch the turn if necessary
    let modifiedFEN = originalFEN;
    if (color === 'b') {
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
      if (move.flags.includes('k') || move.flags.includes('q')) {
        // Handle castling
        const side = move.san === 'O-O' ? 'king-side' : 'queen-side';
        const from = move.from.toUpperCase();
        const to = move.to.toUpperCase();
        return `Castling ${side} from ${from} to ${to}`;
      } else {
        // Handle normal moves
        const pieceName = this.getPieceName(move.piece);
        const from = move.from.toUpperCase();
        const to = move.to.toUpperCase();
        const action = move.captured ? 'captures on' : 'to';
        const promotion = move.promotion ? ` and promotes to ${this.getPieceName(move.promotion)}` : '';
        return `${pieceName} from ${from} ${action} ${to}${promotion}`;
      }
    }

    // If move not found, return the SAN notation
    return sanMove;
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
    return this.getLastMoveByColor('b'); // 'b' for Black.
  }
  getLegalMoves(position) {
    return this.chess.moves({ square: position, verbose: true });
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
  getMoveDetailsFromSAN(sanMove, fen = null) {
    const chessInstance = new Chess(fen || this.chess.fen());
    const moves = chessInstance.moves({ verbose: true });
    const move = moves.find((m) => m.san === sanMove);
    return move || null;
  }
  
  
}
export default GameLogic;
